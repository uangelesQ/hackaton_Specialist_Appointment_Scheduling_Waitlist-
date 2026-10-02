import { test, expect } from '../fixtures/baseTest'
import testData from '../data/testData.json'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { readAudit, readPreferenceAudit } from '../helpers/dbHelper'
import { nextSlot, toIso } from '../helpers/slots'

test.describe('A patient already waiting with no preference', () => {
  // The seed puts Carlos and then Ana on the waitlist before a choice was required, so each test restarts on it
  test.beforeEach(async () => {
    await restartApi({ demoWaitlist: true })
  })

  test('A waiting patient with no preference sets a first one and keeps their place', async ({ api, auth, contactPreference, joinWaitlist, respondToOffer, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US013-002',
      feature: 'US-013 Set or change how I am contacted',
      story: 'BR-019 a waiting patient with no preference can choose at any time',
      severity: 'critical',
      tag: 'positive',
    })
    const ana = actor('noPref1')
    await auth.signInAs('noPref1')
    await expect(contactPreference.getNotChosenYet()).toBeVisible()
    await expect(joinWaitlist.getOnWaitlistHeading()).toBeVisible()

    await contactPreference.changePreferenceTo('In-app')
    await expect(joinWaitlist.getOnWaitlistHeading()).toBeVisible()

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getPositionCell(ana.name)).toHaveText('2')
    await expect(viewWaitlist.getStatusCell(ana.name)).toContainText('Waiting')
    await expect(viewWaitlist.getContactPreferenceCell(ana.name)).toHaveText('In-app')

    const staffToken = await api.tokenFor('staff1')
    const first = await api.release(staffToken, toIso(nextSlot()))
    await api.recordDeclined(staffToken, first.body.offer.id)
    await api.release(staffToken)

    await auth.signInAs('noPref1')
    await expect(respondToOffer.getBanner()).toBeVisible()
    await auth.signInAs('staff1')
    await expect(viewWaitlist.getRequiresCallFlag(ana.name)).toHaveCount(0)
  })

  test('A waiting patient with no preference is shown as Not recorded and flagged as needing a call', async ({ api, auth, releaseSlot, respondToOffer, recordPhoneResponse, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US003-002',
      feature: 'US-003 Be notified of a slot offer',
      story: 'BR-001, BR-019 not recorded is handled as telephone',
      severity: 'critical',
      tag: 'positive',
    })
    const carlos = actor('telephone1')
    const ana = actor('noPref1')
    await auth.signInAs('staff1')
    await expect(viewWaitlist.getContactPreferenceCell(ana.name)).toHaveText('Not recorded')

    await releaseSlot.releaseSlot(nextSlot())
    await expect(viewWaitlist.getRequiresCallFlag(carlos.name)).toBeVisible()

    const staffToken = await api.tokenFor('staff1')
    const view = await api.staffWaitlist(staffToken)
    await api.recordDeclined(staffToken, view.offer?.id ?? 0)
    await api.release(staffToken)

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getRequiresCallFlag(ana.name)).toBeVisible()
    await expect(recordPhoneResponse.getRecordAcceptedButton()).toBeVisible()
    await expect(recordPhoneResponse.getRecordDeclinedButton()).toBeVisible()

    await auth.signInAs('noPref1')
    await expect(respondToOffer.getBanner()).toHaveCount(0)
    await expect(respondToOffer.getTelephoneHolderNotice()).toBeVisible()
  })

  test('The preference and the entry are saved together or not at all', async ({ api, auth, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US006-006',
      feature: 'US-006 Add a patient on their behalf',
      story: 'BR-016 a preference is recorded only with a new entry',
      severity: 'normal',
      tag: 'negative',
    })
    const ana = actor('noPref1')
    const staffToken = await api.tokenFor('staff1')

    const existing = await api.addPatient(staffToken, 'noPref1', 'in_app')
    expect(existing.status).toBe(200)
    expect(existing.body.created).toBe(false)

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getPositionCell(ana.name)).toHaveText('2')
    await expect(viewWaitlist.getContactPreferenceCell(ana.name)).toHaveText('Not recorded')
    expect(readPreferenceAudit()).toHaveLength(0)

    const unknown = await api.send('post', `/waitlist/patients/${testData.unregisteredPatientId}`, staffToken, { contactPreference: 'in_app' })
    expect(unknown.status).toBe(404)
  })

  test('Staff record a not-recorded patient decline', async ({ api, auth, recordPhoneResponse, viewWaitlist, releaseSlot }) => {
    await describeCase({
      id: 'TC-US011-002',
      feature: 'US-011 Record a telephone patient response',
      story: 'BR-001 not recorded is treated as telephone, BR-005 decline',
      severity: 'critical',
      tag: 'positive',
    })
    const ana = actor('noPref1')
    const maria = actor('inApp1')
    const staffToken = await api.tokenFor('staff1')
    await api.addPatient(staffToken, 'inApp1')
    const first = await api.release(staffToken, toIso(nextSlot()))
    await api.recordDeclined(staffToken, first.body.offer.id)
    await api.release(staffToken)

    await auth.signInAs('staff1')
    await expect(releaseSlot.getWaitingOnText(ana.name)).toBeVisible()
    await recordPhoneResponse.recordDeclined()
    await expect(viewWaitlist.getStatusCell(ana.name)).toContainText('Waiting')
    await expect(viewWaitlist.getStatusCell(maria.name)).toContainText('Waiting')

    const released = await api.release(staffToken)
    expect(released.status).toBe(201)
    const view = await api.staffWaitlist(staffToken)
    expect(view.entries.find((entry) => entry.status === 'notified')?.patientName).toBe(maria.name)
    expect(readAudit('offer_declined_by_staff').length).toBeGreaterThanOrEqual(2)
  })
})
