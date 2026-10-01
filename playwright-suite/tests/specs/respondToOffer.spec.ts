import testData from '../data/testData.json'
import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { clockLabel, nextSlot } from '../helpers/slots'

test.describe('Respond to a slot offer', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test('An in-app patient sees the offer banner and other patients see none', async ({ flow, auth, respondToOffer, joinWaitlist }) => {
    await describeCase({
      id: 'TC-US003-001',
      feature: 'US-003 Be notified of a slot offer',
      story: 'In-app banner for the offer holder only',
      severity: 'critical',
      tag: 'positive',
    })
    const slot = nextSlot()
    await flow.seedAndRelease(['inApp1', 'inApp2'], slot)

    await auth.signInAs('inApp1')
    await expect(respondToOffer.getBanner()).toBeVisible()
    await expect(respondToOffer.getSlotText(clockLabel(slot))).toBeVisible()
    await expect(respondToOffer.getSpecialistText()).toBeVisible()
    await expect(respondToOffer.getAcceptButton()).toBeVisible()
    await expect(respondToOffer.getDeclineButton()).toBeVisible()

    await auth.signInAs('inApp2')
    await expect(joinWaitlist.getOnWaitlistHeading()).toBeVisible()
    await expect(respondToOffer.getBanner()).toHaveCount(0)
  })

  test('An in-app patient accepts after a confirm step and the slot is booked', async ({ flow, auth, respondToOffer, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US008-001',
      feature: 'US-008 Accept or decline an offered slot',
      story: 'BR-013 booking completed, BR-008 positions move up',
      severity: 'critical',
      tag: 'positive',
    })
    const slot = nextSlot()
    await flow.seedAndRelease(['inApp1', 'inApp2'], slot)
    await auth.signInAs('inApp1')

    await respondToOffer.getAcceptButton().click()
    await expect(respondToOffer.getConfirmDialog()).toContainText(testData.specialist)
    await expect(respondToOffer.getConfirmDialog()).toContainText(clockLabel(slot))
    await respondToOffer.getConfirmButton().click()

    await expect(respondToOffer.getBookedHeading()).toBeVisible()
    await expect(respondToOffer.getContactOfficeNote()).toBeVisible()

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getRowByPatient(actor('inApp1').name)).toHaveCount(0)
    await expect(viewWaitlist.getPositionCell(actor('inApp2').name)).toHaveText('1')
  })

  test('Going back from the confirm step changes nothing', async ({ flow, auth, respondToOffer }) => {
    await describeCase({
      id: 'TC-US008-002',
      feature: 'US-008 Accept or decline an offered slot',
      story: 'Go back keeps the offer answerable',
      severity: 'normal',
      tag: 'negative',
    })
    await flow.seedAndRelease(['inApp1'], nextSlot())
    await auth.signInAs('inApp1')

    await respondToOffer.getAcceptButton().click()
    await respondToOffer.getCancelButton().click()
    await expect(respondToOffer.getConfirmDialog()).toHaveCount(0)
    await expect(respondToOffer.getBanner()).toBeVisible()
    await expect(respondToOffer.getAcceptButton()).toBeVisible()

    await respondToOffer.acceptOffer()
    await expect(respondToOffer.getBookedHeading()).toBeVisible()
  })

  test('Declining returns the slot to staff and the decliner is not offered it again', async ({ api, flow, auth, respondToOffer, joinWaitlist, releaseSlot, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US008-003',
      feature: 'US-008 Accept or decline an offered slot',
      story: 'BR-005 decline keeps place, slot returns to staff',
      severity: 'critical',
      tag: 'positive',
    })
    const { staffToken } = await flow.seedAndRelease(['inApp1', 'inApp2', 'inApp3'], nextSlot())
    await auth.signInAs('inApp1')

    await respondToOffer.declineOffer()
    await expect(respondToOffer.getBanner()).toHaveCount(0)
    await expect(joinWaitlist.getWaitingNotice()).toBeVisible()

    const view = await api.staffWaitlist(staffToken)
    const statusOf = (alias: 'inApp1' | 'inApp2' | 'inApp3') => view.entries.find((entry) => entry.patientName === actor(alias).name)
    expect(view.offer).toBeNull()
    expect(statusOf('inApp1')).toMatchObject({ status: 'waiting', position: 1 })
    expect(statusOf('inApp2')?.status).toBe('waiting')
    expect(statusOf('inApp3')?.status).toBe('waiting')

    await auth.signInAs('staff1')
    await expect(releaseSlot.getReturnedSlotText()).toBeVisible()
    await releaseSlot.releaseSlot()
    await expect(viewWaitlist.getStatusCell(actor('inApp2').name)).toContainText('Notified')
    await expect(viewWaitlist.getStatusCell(actor('inApp1').name)).toContainText('Waiting')
  })
})
