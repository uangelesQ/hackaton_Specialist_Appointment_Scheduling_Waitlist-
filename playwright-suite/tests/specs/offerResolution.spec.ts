import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { nextSlot } from '../helpers/slots'

test.describe('Only the first action resolves an offer', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test('Accepting an offer that staff already passed on is rejected and changes nothing', async ({ api, flow }) => {
    await describeCase({
      id: 'TC-BR012-001',
      feature: 'BR-012 First action wins',
      story: 'Late accept after pass-on',
      severity: 'critical',
      tag: 'concurrency',
    })
    const { staffToken, offerId } = await flow.seedAndRelease(['inApp1', 'inApp2'], nextSlot())
    const passed = await api.passOn(staffToken, offerId)
    expect(passed.status).toBe(200)

    const late = await api.accept(await api.tokenFor('inApp1'), offerId)
    expect(late.status).toBe(409)
    expect(late.body.error).toBe('offer_not_available')

    const view = await api.staffWaitlist(staffToken)
    const statusOf = (alias: 'inApp1' | 'inApp2') => view.entries.find((entry) => entry.patientName === actor(alias).name)?.status
    expect(statusOf('inApp1')).toBe('waiting')
    expect(statusOf('inApp2')).toBe('notified')
  })

  test('A patient who confirms after the offer was passed on is told it is no longer available', async ({ page, api, flow, auth, respondToOffer }) => {
    await describeCase({
      id: 'TC-BR012-001',
      feature: 'BR-012 First action wins',
      story: 'Stale screen shows the offer is gone',
      severity: 'critical',
      tag: 'concurrency',
    })
    const { staffToken, offerId } = await flow.seedAndRelease(['inApp1', 'inApp2'], nextSlot())
    await auth.signInAs('inApp1')
    await expect(respondToOffer.getBanner()).toBeVisible()

    // The screen refreshes every 10 seconds, so refreshes are blocked to keep the stale offer on screen
    await page.route('**/api/me/waitlist', (route) => route.abort())
    await api.passOn(staffToken, offerId)

    await respondToOffer.getAcceptButton().click()
    await respondToOffer.getConfirmButton().click()
    await expect(respondToOffer.getOfferUnavailableAlert()).toBeVisible()
    await expect(respondToOffer.getBookedHeading()).toHaveCount(0)
  })

  test.fixme('A staff pass-on after a recorded acceptance is rejected and the booking stands', async ({ api, flow, auth, releaseSlot, viewWaitlist }) => {
    // Blocked: the record actions are not built (OpenSpec tasks 3.3, 3.5)
    await describeCase({
      id: 'TC-BR012-001',
      feature: 'BR-012 First action wins',
      story: 'Staff-recorded response versus pass-on',
      severity: 'critical',
      tag: 'concurrency',
    })
    const { staffToken, offerId } = await flow.seedAndRelease(['telephone1', 'inApp1'], nextSlot())
    await api.recordAccepted(staffToken, offerId)

    await auth.signInAs('staff1')
    const late = await api.passOn(staffToken, offerId)
    expect(late.status).toBe(409)
    expect(late.body.error).toBe('offer_not_available')
    await expect(viewWaitlist.getRowByPatient(actor('telephone1').name)).toHaveCount(0)
    await expect(releaseSlot.getPassOnButton()).toHaveCount(0)

    const second = await flow.seedAndRelease(['notRecorded1'], nextSlot())
    const results = await Promise.all([api.recordAccepted(second.staffToken, second.offerId), api.passOn(second.staffToken, second.offerId)])
    expect(results.map((result) => result.status).sort()).toContain(409)
  })
})
