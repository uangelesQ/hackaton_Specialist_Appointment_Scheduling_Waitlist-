import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { nextSlot, toIso } from '../helpers/slots'

test.describe('Release an open slot', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test('Releasing a slot offers it to the next patient in line only', async ({ api, auth, releaseSlot, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US009-001',
      feature: 'US-009 Release an open slot',
      story: 'BR-006 next in line, BR-001 call flag',
      severity: 'critical',
      tag: 'positive',
    })
    const carlos = actor('telephone1')
    await api.seedWaiting(['telephone1', 'telephone2', 'inApp1'])

    await auth.signInAs('staff1')
    await releaseSlot.releaseSlot(nextSlot())

    await expect(viewWaitlist.getStatusCell(carlos.name)).toContainText('Notified')
    await expect(viewWaitlist.getRequiresCallFlag(carlos.name)).toBeVisible()
    await expect(viewWaitlist.getStatusCell(actor('telephone2').name)).toContainText('Waiting')
    await expect(viewWaitlist.getStatusCell(actor('inApp1').name)).toContainText('Waiting')
    await expect(viewWaitlist.getPositionCell(carlos.name)).toHaveText('1')
  })

  test('Only one offer can be outstanding at a time', async ({ api, flow, auth, releaseSlot }) => {
    await describeCase({
      id: 'TC-US009-002',
      feature: 'US-009 Release an open slot',
      story: 'BR-007 one outstanding offer',
      severity: 'critical',
      tag: 'concurrency',
    })
    const { staffToken, offerId } = await flow.seedAndRelease(['telephone1', 'telephone2', 'inApp1'], nextSlot())

    await auth.signInAs('staff1')
    await expect(releaseSlot.getWaitingOnText(actor('telephone1').name)).toBeVisible()
    await expect(releaseSlot.getReleaseButton()).toHaveCount(0)

    const second = await api.release(staffToken, toIso(nextSlot()))
    expect(second.status).toBe(409)
    expect(second.body.error).toBe('offer_outstanding')

    await api.recordDeclined(staffToken, offerId)
    const secondStaffToken = await api.tokenFor('staff2')
    const results = await Promise.all([api.release(staffToken), api.release(secondStaffToken)])
    expect(results.map((result) => result.status).sort()).toEqual([201, 409])
  })
})
