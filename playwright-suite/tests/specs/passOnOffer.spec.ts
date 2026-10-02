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

  test('Passing on moves the offer to the next in line and the passed-over patient is not re-offered', async ({ page, api, auth, releaseSlot, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US010-001',
      feature: 'US-010 Pass an unanswered offer on',
      story: 'BR-005 passed-over patient is not re-offered the slot',
      severity: 'critical',
      tag: 'positive',
    })
    await api.seedWaiting(['telephone1', 'telephone2', 'inApp1'])
    const staffToken = await api.tokenFor('staff1')
    const first = await api.release(staffToken, toIso(nextSlot()))
    await api.recordDeclined(staffToken, first.body.offer.id)
    await api.release(staffToken)

    await auth.signInAs('staff1')
    await releaseSlot.passOnOffer()
    await expect(viewWaitlist.getStatusCell(actor('telephone2').name)).toContainText('Waiting')
    await expect(viewWaitlist.getStatusCell(actor('inApp1').name)).toContainText('Notified')
    await expect(viewWaitlist.getStatusCell(actor('telephone1').name)).toContainText('Waiting')

    const view = await api.staffWaitlist(staffToken)
    await api.decline(await api.tokenFor('inApp1'), view.offer?.id ?? 0)
    await page.reload()
    await expect(releaseSlot.getNoEligibleText()).toBeVisible()
    await expect(releaseSlot.getReleaseButton()).toHaveCount(0)
  })

  test('Nobody eligible leaves the slot with staff and offers no release action', async ({ api, flow, auth, releaseSlot, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US010-002',
      feature: 'US-010 Pass an unanswered offer on',
      story: 'BR-005 slot returns to staff when nobody is eligible',
      severity: 'critical',
      tag: 'boundary',
    })
    const { staffToken } = await flow.seedAndRelease(['telephone2'], nextSlot())

    await auth.signInAs('staff1')
    await releaseSlot.passOnOffer()
    await expect(viewWaitlist.getStatusCell(actor('telephone2').name)).toContainText('Waiting')
    await expect(releaseSlot.getNoEligibleText()).toBeVisible()
    await expect(releaseSlot.getReleaseButton()).toHaveCount(0)

    const rejected = await api.release(staffToken)
    expect(rejected.status).toBe(409)
    expect(rejected.body.error).toBe('no_eligible_patient')
  })
})
