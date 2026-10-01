import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { nextSlot, toIso } from '../helpers/slots'

test.describe('Pass an unanswered offer on', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test.fixme('Passing on moves the offer to the next in line and the passed-over patient is not re-offered', async ({ api, auth, releaseSlot, viewWaitlist }) => {
    // Blocked: passed-over patients are still eligible (OpenSpec tasks 2.1, 2.2, 3.3)
    await describeCase({
      id: 'TC-US010-001',
      feature: 'US-010 Pass an unanswered offer on',
      story: 'BR-005 passed-over patient is not re-offered the slot',
      severity: 'critical',
      tag: 'positive',
    })
    const slotA = nextSlot()
    const slotB = nextSlot()
    await api.seedWaiting(['telephone1', 'notRecorded1', 'inApp1'])
    const staffToken = await api.tokenFor('staff1')
    const first = await api.release(staffToken, toIso(slotA))
    await api.recordDeclined(staffToken, first.body.offer.id)
    await api.release(staffToken)

    await auth.signInAs('staff1')
    await releaseSlot.passOnOffer()
    await expect(viewWaitlist.getStatusCell(actor('notRecorded1').name)).toContainText('Waiting')
    await expect(viewWaitlist.getStatusCell(actor('inApp1').name)).toContainText('Notified')
    await expect(viewWaitlist.getStatusCell(actor('telephone1').name)).toContainText('Waiting')

    const maria = await api.tokenFor('inApp1')
    const view = await api.staffWaitlist(staffToken)
    await api.decline(maria, view.offer?.id ?? 0)
    await expect(releaseSlot.getNoEligibleText()).toBeVisible()
    await expect(releaseSlot.getReleaseButton()).toHaveCount(0)

    await releaseSlot.releaseSlot(slotB)
    await expect(viewWaitlist.getStatusCell(actor('telephone1').name)).toContainText('Notified')
  })

  test.fixme('Nobody eligible leaves the slot with staff and offers no release action', async ({ api, flow, auth, releaseSlot, viewWaitlist }) => {
    // Blocked: passed-over patients are still eligible (OpenSpec tasks 2.1, 2.3)
    await describeCase({
      id: 'TC-US010-002',
      feature: 'US-010 Pass an unanswered offer on',
      story: 'BR-005 slot returns to staff when nobody is eligible',
      severity: 'critical',
      tag: 'boundary',
    })
    const { staffToken, offerId } = await flow.seedAndRelease(['notRecorded1'], nextSlot())

    await auth.signInAs('staff1')
    await releaseSlot.passOnOffer()
    await expect(viewWaitlist.getStatusCell(actor('notRecorded1').name)).toContainText('Waiting')
    await expect(releaseSlot.getNoEligibleText()).toBeVisible()
    await expect(releaseSlot.getReleaseButton()).toHaveCount(0)

    const rejected = await api.release(staffToken)
    expect(rejected.status).toBe(409)
    expect(rejected.body.error).toBe('no_eligible_patient')
    expect(offerId).toBeGreaterThan(0)

    await releaseSlot.releaseSlot(nextSlot())
    await expect(viewWaitlist.getStatusCell(actor('notRecorded1').name)).toContainText('Notified')
  })
})
