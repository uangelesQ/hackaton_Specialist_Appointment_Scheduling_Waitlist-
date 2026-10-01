import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { nextSlot, toIso } from '../helpers/slots'

test.describe('Record a telephone patient response', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test.fixme('Staff record a telephone patient acceptance and the audit shows it was staff-entered', async ({ api, flow, auth, recordPhoneResponse, viewWaitlist }) => {
    // Blocked: the record actions and staff-entered audit are not built (OpenSpec tasks 3.3, 3.4, 5.5)
    await describeCase({
      id: 'TC-US011-001',
      feature: 'US-011 Record a telephone patient response',
      story: 'BR-010 staff-entered response, BR-013 booking completed',
      severity: 'critical',
      tag: 'positive',
    })
    const slot = nextSlot()
    const { staffToken } = await flow.seedAndRelease(['telephone1', 'notRecorded1'], slot)

    await auth.signInAs('staff1')
    await recordPhoneResponse.recordAccepted()
    await expect(viewWaitlist.getRowByPatient(actor('telephone1').name)).toHaveCount(0)
    await expect(viewWaitlist.getPositionCell(actor('notRecorded1').name)).toHaveText('1')

    const again = await api.release(staffToken, toIso(slot))
    expect(again.status).toBe(409)
    expect(again.body.error).toBe('slot_already_booked')
  })

  test.fixme('Staff record a not-recorded patient decline', async ({ api, flow, auth, recordPhoneResponse, viewWaitlist }) => {
    // Blocked: the record actions are not built (OpenSpec tasks 3.3, 5.5)
    await describeCase({
      id: 'TC-US011-002',
      feature: 'US-011 Record a telephone patient response',
      story: 'BR-001 not recorded is treated as telephone, BR-005 decline',
      severity: 'critical',
      tag: 'positive',
    })
    const { staffToken } = await flow.seedAndRelease(['notRecorded1', 'inApp1'], nextSlot())

    await auth.signInAs('staff1')
    await recordPhoneResponse.recordDeclined()
    await expect(viewWaitlist.getStatusCell(actor('notRecorded1').name)).toContainText('Waiting')
    await expect(viewWaitlist.getStatusCell(actor('inApp1').name)).toContainText('Waiting')

    const released = await api.release(staffToken)
    expect(released.status).toBe(201)
    const view = await api.staffWaitlist(staffToken)
    expect(view.entries.find((entry) => entry.status === 'notified')?.patientName).toBe(actor('inApp1').name)
  })

  test.fixme('Each patient answers in exactly one place', async ({ api, flow, auth, recordPhoneResponse, respondToOffer }) => {
    // Blocked: the response channel by preference is not built (OpenSpec tasks 3.1, 3.3)
    await describeCase({
      id: 'TC-BR001-001',
      feature: 'BR-001 One response channel per patient',
      story: 'In-app response refused for telephone, record refused for in-app',
      severity: 'critical',
      tag: 'permission',
    })
    const { staffToken, offerId } = await flow.seedAndRelease(['telephone1', 'inApp1'], nextSlot())
    const carlos = await api.tokenFor('telephone1')

    expect((await api.accept(carlos, offerId)).status).toBe(403)
    expect((await api.decline(carlos, offerId)).status).toBe(403)
    await api.recordDeclined(staffToken, offerId)
    await api.release(staffToken)

    await auth.signInAs('staff1')
    await expect(recordPhoneResponse.getRecordAcceptedButton()).toHaveCount(0)
    await expect(recordPhoneResponse.getRecordDeclinedButton()).toHaveCount(0)
    const view = await api.staffWaitlist(staffToken)
    const refused = await api.recordAccepted(staffToken, view.offer?.id ?? 0)
    expect(refused.status).toBe(409)

    await auth.signInAs('telephone1')
    await expect(respondToOffer.getBanner()).toHaveCount(0)
    await expect(respondToOffer.getAcceptButton()).toHaveCount(0)
  })
})
