import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { readAudit } from '../helpers/dbHelper'
import { nextSlot, toIso } from '../helpers/slots'

test.describe('Record a telephone patient response', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test('Staff record a telephone patient acceptance and the audit shows it was staff-entered', async ({ api, flow, auth, recordPhoneResponse, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US011-001',
      feature: 'US-011 Record a telephone patient response',
      story: 'BR-010 staff-entered response, BR-013 booking completed',
      severity: 'critical',
      tag: 'positive',
    })
    const slot = nextSlot()
    const { staffToken } = await flow.seedAndRelease(['telephone1', 'telephone2'], slot)

    await auth.signInAs('staff1')
    await recordPhoneResponse.recordAccepted()
    await expect(viewWaitlist.getRowByPatient(actor('telephone1').name)).toHaveCount(0)
    await expect(viewWaitlist.getPositionCell(actor('telephone2').name)).toHaveText('1')

    const rows = readAudit('offer_accepted_by_staff')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ actor_type: 'staff' })

    const again = await api.release(staffToken, toIso(slot))
    expect(again.status).toBe(409)
    expect(again.body.error).toBe('slot_already_booked')
  })

  test('Each patient answers in exactly one place', async ({ api, flow, auth, recordPhoneResponse, respondToOffer, releaseSlot }) => {
    await describeCase({
      id: 'TC-BR001-001',
      feature: 'BR-001 One response channel per patient',
      story: 'In-app response refused for telephone, record refused for in-app',
      severity: 'critical',
      tag: 'permission',
    })
    const { staffToken, offerId } = await flow.seedAndRelease(['telephone1', 'inApp1'], nextSlot())
    const carlos = await api.tokenFor('telephone1')

    const accept = await api.accept(carlos, offerId)
    expect(accept.status).toBe(403)
    expect(accept.body.error).toBe('response_by_staff')
    expect((await api.decline(carlos, offerId)).status).toBe(403)

    await auth.signInAs('telephone1')
    await expect(respondToOffer.getTelephoneHolderNotice()).toBeVisible()
    await expect(respondToOffer.getBanner()).toHaveCount(0)
    await expect(respondToOffer.getAcceptButton()).toHaveCount(0)

    await api.recordDeclined(staffToken, offerId)
    await api.release(staffToken)
    await auth.signInAs('staff1')
    await expect(releaseSlot.getWaitingOnText(actor('inApp1').name)).toBeVisible()
    await expect(recordPhoneResponse.getRecordAcceptedButton()).toHaveCount(0)
    await expect(recordPhoneResponse.getRecordDeclinedButton()).toHaveCount(0)

    const view = await api.staffWaitlist(staffToken)
    const refused = await api.recordAccepted(staffToken, view.offer?.id ?? 0)
    expect(refused.status).toBe(409)
    expect(refused.body.error).toBe('patient_responds_in_app')
  })
})
