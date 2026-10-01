import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { nextSlot } from '../helpers/slots'

test.describe('View the waitlist', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test('An empty waitlist shows a message and no release action', async ({ auth, viewWaitlist, releaseSlot }) => {
    await describeCase({
      id: 'TC-US004-002',
      feature: 'US-004 View the waitlist',
      story: 'Empty waitlist',
      severity: 'normal',
      tag: 'boundary',
    })
    await auth.signInAs('staff1')

    await expect(viewWaitlist.getEmptyMessage()).toBeVisible()
    await expect(releaseSlot.getReleaseButton()).toHaveCount(0)
  })

  test.fixme('The staff table shows position order, contact preference and a call flag, and no deferred controls', async ({ flow, auth, viewWaitlist }) => {
    // Blocked: preference column, call flag and hidden controls are not built (OpenSpec tasks 4.1, 5.4)
    await describeCase({
      id: 'TC-US004-001',
      feature: 'US-004 View the waitlist',
      story: 'Staff table columns and call flag',
      severity: 'critical',
      tag: 'positive',
    })
    const carlos = actor('telephone1')
    const ana = actor('notRecorded1')
    const maria = actor('inApp1')
    await flow.seedAndRelease(['telephone1', 'notRecorded1', 'inApp1'], nextSlot())

    await auth.signInAs('staff1')
    await expect.poll(() => viewWaitlist.readPatientOrder()).toEqual([carlos.name, ana.name, maria.name])
    await expect(viewWaitlist.getContactPreferenceCell(carlos.name)).toHaveText('Telephone')
    await expect(viewWaitlist.getContactPreferenceCell(ana.name)).toHaveText('Not recorded')
    await expect(viewWaitlist.getContactPreferenceCell(maria.name)).toHaveText('In-app')
    await expect(viewWaitlist.getColumnHeader('Joined')).toHaveCount(0)
    await expect(viewWaitlist.getRemoveButton(carlos.name)).toHaveCount(0)
    await expect(viewWaitlist.getRequiresCallFlag(carlos.name)).toBeVisible()
    await expect(viewWaitlist.getRequiresCallFlag(ana.name)).toHaveCount(0)
  })
})
