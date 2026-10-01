import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { nextSlot } from '../helpers/slots'

test.describe('Offer access', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test('A patient cannot view or answer another patient offer', async ({ api, flow, auth, respondToOffer, joinWaitlist }) => {
    await describeCase({
      id: 'TC-BR011-001',
      feature: 'BR-011 Patients see only their own offer',
      story: 'Other patients cannot answer the offer',
      severity: 'critical',
      tag: 'permission',
    })
    const { staffToken, offerId } = await flow.seedAndRelease(['inApp1', 'inApp2'], nextSlot())
    const other = await api.tokenFor('inApp2')

    expect((await api.accept(other, offerId)).status).toBe(403)
    expect((await api.decline(other, offerId)).status).toBe(403)
    expect((await api.send('post', `/offers/${offerId}/accept`)).status).toBe(401)

    const view = await api.staffWaitlist(staffToken)
    expect(view.offer?.id).toBe(offerId)
    expect(view.entries.find((entry) => entry.id === view.offer?.entryId)?.patientName).toBe(actor('inApp1').name)

    await auth.signInAs('inApp2')
    await expect(joinWaitlist.getOnWaitlistHeading()).toBeVisible()
    await expect(respondToOffer.getBanner()).toHaveCount(0)
  })
})
