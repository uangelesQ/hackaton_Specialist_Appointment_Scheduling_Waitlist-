import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'

test.describe('Join the waitlist', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test('A registered in-app patient joins the waitlist and is listed last for staff', async ({ api, auth, joinWaitlist, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US001-001',
      feature: 'US-001 Join the specialty waitlist',
      story: 'BR-004 one active entry, BR-006 join order',
      severity: 'critical',
      tag: 'positive',
    })
    await api.seedWaiting(['telephone1', 'notRecorded1'])

    await auth.signInAs('inApp1')
    await expect(joinWaitlist.getNotJoinedHeading()).toBeVisible()
    await joinWaitlist.joinWaitlist()
    await expect(joinWaitlist.getWaitingNotice()).toBeVisible()

    await auth.signInAs('staff1')
    await expect
      .poll(() => viewWaitlist.readPatientOrder())
      .toEqual([actor('telephone1').name, actor('notRecorded1').name, actor('inApp1').name])
    await expect(viewWaitlist.getStatusCell(actor('inApp1').name)).toContainText('Waiting')
  })

  test.fixme('A joined patient sees her status with no queue position, count or Leave action', async ({ api, auth, joinWaitlist }) => {
    // Blocked: position and Leave are still shown (OpenSpec task 5.1)
    await describeCase({
      id: 'TC-US001-001',
      feature: 'US-001 Join the specialty waitlist',
      story: 'Patient sees status, not a queue position',
      severity: 'critical',
      tag: 'negative',
    })
    await api.seedWaiting(['telephone1', 'notRecorded1'])
    await auth.signInAs('inApp1')
    await joinWaitlist.joinWaitlist()

    await expect(joinWaitlist.getPositionBadge()).toHaveCount(0)
    await expect(joinWaitlist.getLeaveButton()).toHaveCount(0)
  })

  test('Joining twice does not create a second entry', async ({ api, auth, joinWaitlist }) => {
    await describeCase({
      id: 'TC-US001-002',
      feature: 'US-001 Join the specialty waitlist',
      story: 'BR-004 one active entry per patient',
      severity: 'normal',
      tag: 'boundary',
    })
    const first = await api.join('inApp1')
    const second = await api.join('inApp1')
    expect(first.status).toBe(201)
    expect(second.status).toBe(200)
    expect(second.body.created).toBe(false)

    const view = await api.staffWaitlist(await api.tokenFor('staff1'))
    expect(view.entries.filter((entry) => entry.patientName === actor('inApp1').name)).toHaveLength(1)

    await auth.signInAs('inApp1')
    await expect(joinWaitlist.getOnWaitlistHeading()).toBeVisible()
    await expect(joinWaitlist.getJoinButton()).toHaveCount(0)
  })
})
