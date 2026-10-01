import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { nextSlot, toIso } from '../helpers/slots'

test.describe('A booked slot is not released again', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test.fixme('A booked slot cannot be released again', async ({ api, flow, auth, releaseSlot, viewWaitlist }) => {
    // Blocked: the booked-slot refusal is not built (OpenSpec task 2.4)
    await describeCase({
      id: 'TC-BR013-001',
      feature: 'BR-013 Booked slot is not released again',
      story: 'Release of a booked slot is rejected',
      severity: 'critical',
      tag: 'negative',
    })
    const slotA = nextSlot()
    const slotB = nextSlot()
    const { staffToken, offerId } = await flow.seedAndRelease(['inApp1'], slotA)
    await api.accept(await api.tokenFor('inApp1'), offerId)
    await api.seedWaiting(['inApp2'])

    await auth.signInAs('staff1')
    await expect(releaseSlot.getReleaseButton()).toBeVisible()
    const rejected = await api.release(staffToken, toIso(slotA))
    expect(rejected.status).toBe(409)
    expect(rejected.body.error).toBe('slot_already_booked')
    expect((await api.staffWaitlist(staffToken)).offer).toBeNull()

    await releaseSlot.releaseSlot(slotB)
    await expect(viewWaitlist.getStatusCell(actor('inApp2').name)).toBeVisible()
  })
})
