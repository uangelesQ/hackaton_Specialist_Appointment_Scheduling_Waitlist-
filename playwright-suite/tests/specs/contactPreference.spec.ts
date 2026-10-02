import { test, expect } from '../fixtures/baseTest'
import { AuthHelper } from '../helpers/authHelper'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { readPreferenceAudit } from '../helpers/dbHelper'
import { nextSlot, toIso } from '../helpers/slots'
import { ContactPreferencePO } from '../pageObjects/contactPreferencePO'

test.describe('Choose and change the contact preference', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test('A patient with no preference is asked to choose, with each option described, before joining', async ({ auth, contactPreference, joinWaitlist, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US012-001',
      feature: 'US-012 Choose how to be contacted',
      story: 'BR-014 choice asked before joining',
      severity: 'critical',
      tag: 'positive',
    })
    await auth.signInAs('noPref1')
    await expect(contactPreference.getNotChosenYet()).toBeVisible()
    await expect(joinWaitlist.getNotJoinedHeading()).toBeVisible()

    await contactPreference.openJoinChoice()
    await expect(contactPreference.getOptionGroup()).toBeVisible()
    await expect(contactPreference.getOption('In-app')).toBeVisible()
    await expect(contactPreference.getOption('Telephone')).toBeVisible()
    await expect(contactPreference.getConfirmAndJoinButton()).toBeDisabled()

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getEmptyMessage()).toBeVisible()
  })

  test('Choosing and confirming saves the preference, joins the waitlist and confirms both', async ({ api, auth, contactPreference, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US012-002',
      feature: 'US-012 Choose how to be contacted',
      story: 'BR-015 the choice is saved and audited',
      severity: 'critical',
      tag: 'positive',
    })
    const ana = actor('noPref1')
    await api.seedWaiting(['telephone1'])

    await auth.signInAs('noPref1')
    await contactPreference.chooseAndJoin('Telephone')
    await expect(contactPreference.getSavedNotice('Telephone')).toBeVisible()
    await expect(contactPreference.getCurrentPreference('Telephone')).toBeVisible()

    await auth.signInAs('staff1')
    await expect.poll(() => viewWaitlist.readPatientOrder()).toEqual([actor('telephone1').name, ana.name])
    await expect(viewWaitlist.getContactPreferenceCell(ana.name)).toHaveText('Telephone')

    const rows = readPreferenceAudit()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ actor_type: 'patient', previous_value: null, new_value: 'telephone' })
    expect(rows[0]?.at).toBeTruthy()
  })

  test('Leaving the choice without choosing saves nothing and creates no entry', async ({ auth, contactPreference, joinWaitlist, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US012-003',
      feature: 'US-012 Choose how to be contacted',
      story: 'Cancel saves nothing',
      severity: 'normal',
      tag: 'negative',
    })
    await auth.signInAs('noPref1')
    await contactPreference.openJoinChoice()
    await contactPreference.getOption('In-app').check()
    await contactPreference.getCancelButton().click()

    await expect(joinWaitlist.getJoinButton()).toBeVisible()
    await expect(contactPreference.getNotChosenYet()).toBeVisible()

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getEmptyMessage()).toBeVisible()
    expect(readPreferenceAudit()).toHaveLength(0)
  })

  test('A patient who already has a recorded preference joins without being asked', async ({ auth, contactPreference, joinWaitlist }) => {
    await describeCase({
      id: 'TC-US012-004',
      feature: 'US-012 Choose how to be contacted',
      story: 'No second choice for a recorded preference',
      severity: 'normal',
      tag: 'positive',
    })
    await auth.signInAs('inApp1')
    await joinWaitlist.joinWaitlist()

    await expect(joinWaitlist.getOnWaitlistHeading()).toBeVisible()
    await expect(contactPreference.getJoinPrompt()).toHaveCount(0)
    await expect(contactPreference.getCurrentPreference('In-app')).toBeVisible()
  })

  test('A failed join after the choice keeps the preference, and a retry does not ask again', async ({ page, auth, contactPreference, joinWaitlist }) => {
    await describeCase({
      id: 'TC-US012-005',
      feature: 'US-012 Choose how to be contacted',
      story: 'BR-015 a saved choice survives a failed join',
      severity: 'critical',
      tag: 'negative',
    })
    await auth.signInAs('noPref1')
    await contactPreference.openJoinChoice()
    await contactPreference.getOption('In-app').check()

    await page.route('**/api/waitlist', (route) => (route.request().method() === 'POST' ? route.abort() : route.continue()))
    await contactPreference.getConfirmAndJoinButton().click()
    await expect(contactPreference.getJoinFailedAlert()).toBeVisible()
    await expect(joinWaitlist.getOnWaitlistHeading()).toHaveCount(0)
    await expect(contactPreference.getCurrentPreference('In-app')).toBeVisible()

    await page.unroute('**/api/waitlist')
    await joinWaitlist.joinWaitlist()
    await expect(joinWaitlist.getOnWaitlistHeading()).toBeVisible()
    await expect(contactPreference.getJoinPrompt()).toHaveCount(0)
  })

  test('A patient changes the preference; the new value is shown and the entry is unchanged', async ({ api, auth, contactPreference, joinWaitlist, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US013-001',
      feature: 'US-013 Set or change how I am contacted',
      story: 'BR-018 a change does not move the entry',
      severity: 'critical',
      tag: 'positive',
    })
    const maria = actor('inApp1')
    await api.seedWaiting(['inApp1', 'inApp2'])

    await auth.signInAs('inApp1')
    await contactPreference.changePreferenceTo('Telephone')
    await expect(contactPreference.getCurrentPreference('Telephone')).toBeVisible()
    await expect(joinWaitlist.getOnWaitlistHeading()).toBeVisible()

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getPositionCell(maria.name)).toHaveText('1')
    await expect(viewWaitlist.getStatusCell(maria.name)).toContainText('Waiting')
    await expect(viewWaitlist.getContactPreferenceCell(maria.name)).toHaveText('Telephone')
    await expect(viewWaitlist.getPositionCell(actor('inApp2').name)).toHaveText('2')
  })

  test('Switching from in-app to telephone while holding an offer removes the banner and flags the call', async ({ flow, auth, contactPreference, respondToOffer, releaseSlot, viewWaitlist, recordPhoneResponse }) => {
    await describeCase({
      id: 'TC-US013-003',
      feature: 'US-013 Set or change how I am contacted',
      story: 'BR-017 a change applies at once to a held offer',
      severity: 'critical',
      tag: 'positive',
    })
    const maria = actor('inApp1')
    await flow.seedAndRelease(['inApp1', 'inApp2'], nextSlot())

    await auth.signInAs('inApp1')
    await expect(respondToOffer.getBanner()).toBeVisible()
    await contactPreference.changePreferenceTo('Telephone')

    await expect(respondToOffer.getBanner()).toHaveCount(0)
    await expect(respondToOffer.getAcceptButton()).toHaveCount(0)
    await expect(respondToOffer.getTelephoneHolderNotice()).toBeVisible()

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getRequiresCallFlag(maria.name)).toBeVisible()
    await expect(recordPhoneResponse.getRecordAcceptedButton()).toBeVisible()
    await expect(releaseSlot.getTimeOutstanding()).toBeVisible()
    await expect(viewWaitlist.getStatusCell(actor('inApp2').name)).toContainText('Waiting')
  })

  test('Switching from telephone to in-app while holding an offer shows the banner and clears the call flag', async ({ flow, auth, contactPreference, respondToOffer, releaseSlot, viewWaitlist, recordPhoneResponse }) => {
    await describeCase({
      id: 'TC-US013-004',
      feature: 'US-013 Set or change how I am contacted',
      story: 'BR-017 a change applies at once to a held offer',
      severity: 'critical',
      tag: 'positive',
    })
    const carlos = actor('telephone1')
    await flow.seedAndRelease(['telephone1', 'telephone2'], nextSlot())

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getRequiresCallFlag(carlos.name)).toBeVisible()
    await expect(recordPhoneResponse.getRecordAcceptedButton()).toBeVisible()

    await auth.signInAs('telephone1')
    await expect(respondToOffer.getTelephoneHolderNotice()).toBeVisible()
    await expect(respondToOffer.getBanner()).toHaveCount(0)
    await contactPreference.changePreferenceTo('In-app')
    await expect(respondToOffer.getBanner()).toBeVisible()
    await expect(respondToOffer.getAcceptButton()).toBeVisible()
    await expect(respondToOffer.getDeclineButton()).toBeVisible()

    await auth.signInAs('staff1')
    await expect(releaseSlot.getWaitingOnText(carlos.name)).toBeVisible()
    await expect(viewWaitlist.getRequiresCallFlag(carlos.name)).toHaveCount(0)
    await expect(recordPhoneResponse.getRecordAcceptedButton()).toHaveCount(0)
    await expect(releaseSlot.getTimeOutstanding()).toBeVisible()
  })

  test('A patient on the confirmation step who switched to telephone elsewhere cannot book', async ({ api, flow, auth, context, respondToOffer }) => {
    await describeCase({
      id: 'TC-US013-005',
      feature: 'US-013 Set or change how I am contacted',
      story: 'BR-021 availability is decided when the action is taken',
      severity: 'critical',
      tag: 'concurrency',
    })
    const { staffToken } = await flow.seedAndRelease(['inApp1', 'inApp2'], nextSlot())
    await auth.signInAs('inApp1')
    await respondToOffer.getAcceptButton().click()
    await expect(respondToOffer.getConfirmDialog()).toBeVisible()

    const other = await context.newPage()
    await new AuthHelper(other).signInAs('inApp1')
    await new ContactPreferencePO(other).changePreferenceTo('Telephone')

    await respondToOffer.getConfirmButton().click()
    await expect(respondToOffer.getStaffWillRecordAlert()).toBeVisible()
    await expect(respondToOffer.getBookedHeading()).toHaveCount(0)

    const view = await api.staffWaitlist(staffToken)
    expect(view.offer?.entryId).toBeDefined()
    expect(view.entries.find((entry) => entry.patientName === actor('inApp1').name)?.status).toBe('notified')
    expect(view.entries.find((entry) => entry.patientName === actor('inApp2').name)?.status).toBe('waiting')
  })

  test('Staff cannot record a response for a patient who has switched to in-app', async ({ api, flow, auth, context, recordPhoneResponse }) => {
    await describeCase({
      id: 'TC-US013-006',
      feature: 'US-013 Set or change how I am contacted',
      story: 'BR-021 staff recording is refused after a switch to in-app',
      severity: 'critical',
      tag: 'concurrency',
    })
    const { staffToken } = await flow.seedAndRelease(['telephone1'], nextSlot())
    await auth.signInAs('staff1')
    await expect(recordPhoneResponse.getRecordAcceptedButton()).toBeVisible()

    const other = await context.newPage()
    await new AuthHelper(other).signInAs('telephone1')
    await new ContactPreferencePO(other).changePreferenceTo('In-app')

    await recordPhoneResponse.recordAccepted()
    await expect(recordPhoneResponse.getCannotRecordAlert()).toBeVisible()

    const view = await api.staffWaitlist(staffToken)
    expect(view.offer).not.toBeNull()
    expect(view.entries.find((entry) => entry.patientName === actor('telephone1').name)?.status).toBe('notified')
  })

  test('A patient with a booked entry or no entry can set the preference without creating or changing an entry', async ({ api, flow, auth, contactPreference, respondToOffer, joinWaitlist, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US013-007',
      feature: 'US-013 Set or change how I am contacted',
      story: 'BR-018 the preference is the patient own setting',
      severity: 'normal',
      tag: 'boundary',
    })
    const diego = actor('inApp2')
    await flow.seedAndRelease(['inApp1'], nextSlot())

    await auth.signInAs('inApp1')
    await respondToOffer.acceptOffer()
    await contactPreference.changePreferenceTo('Telephone')
    await expect(respondToOffer.getBookedHeading()).toBeVisible()

    await auth.signInAs('inApp2')
    await contactPreference.changePreferenceTo('Telephone')
    await expect(joinWaitlist.getNotJoinedHeading()).toBeVisible()

    const staffToken = await api.tokenFor('staff1')
    expect((await api.staffWaitlist(staffToken)).entries).toHaveLength(0)

    await joinWaitlist.joinWaitlist()
    await expect(contactPreference.getJoinPrompt()).toHaveCount(0)
    await auth.signInAs('staff1')
    await expect(viewWaitlist.getContactPreferenceCell(diego.name)).toHaveText('Telephone')
  })

  test('A response already recorded is not changed by a later change of preference', async ({ api, flow, auth, contactPreference, respondToOffer }) => {
    await describeCase({
      id: 'TC-US013-008',
      feature: 'US-013 Set or change how I am contacted',
      story: 'BR-018 a recorded response stands',
      severity: 'critical',
      tag: 'negative',
    })
    const slotA = nextSlot()
    const { staffToken } = await flow.seedAndRelease(['inApp1', 'telephone1'], slotA)

    await auth.signInAs('inApp1')
    await respondToOffer.acceptOffer()
    await contactPreference.changePreferenceTo('Telephone')
    await expect(respondToOffer.getBookedHeading()).toBeVisible()
    const again = await api.release(staffToken, toIso(slotA))
    expect(again.status).toBe(409)
    expect(again.body.error).toBe('slot_already_booked')

    const second = await api.release(staffToken, toIso(nextSlot()))
    await api.recordDeclined(staffToken, second.body.offer.id)
    await auth.signInAs('telephone1')
    await contactPreference.changePreferenceTo('In-app')

    const view = await api.staffWaitlist(staffToken)
    const carlos = view.entries.find((entry) => entry.patientName === actor('telephone1').name)
    expect(carlos).toMatchObject({ status: 'waiting', position: 1 })
    expect(view.offer).toBeNull()
    expect(view.release.openSlotStartsAt).not.toBeNull()
  })

  test('A patient cannot change another patient preference, and invalid values are refused', async ({ api }) => {
    await describeCase({
      id: 'TC-US013-009',
      feature: 'US-013 Set or change how I am contacted',
      story: 'BR-011, BR-015 only the patient changes their own preference',
      severity: 'critical',
      tag: 'permission',
    })
    const maria = await api.tokenFor('inApp1')
    const diego = await api.tokenFor('inApp2')
    const staff = await api.tokenFor('staff1')
    const diegoId = await api.idOf(actor('inApp2'))

    const invalid = await api.setPreference(maria, 'fax')
    expect(invalid.status).toBe(400)
    expect((await api.me(maria)).body.contactPreference).toBe('in_app')

    const named = await api.send('put', '/me/contact-preference', maria, { contactPreference: 'telephone', patientId: diegoId })
    expect(named.status).toBe(200)
    expect((await api.me(maria)).body.contactPreference).toBe('telephone')
    expect((await api.me(diego)).body.contactPreference).toBe('in_app')

    expect((await api.setPreference(staff, 'telephone')).status).toBe(403)
    expect((await api.send('put', `/patients/${diegoId}`, staff, { contactPreference: 'telephone' })).status).toBe(404)
    expect((await api.send('put', '/me', maria, { contactPreference: 'telephone' })).status).toBe(404)
    expect((await api.me(diego)).body.contactPreference).toBe('in_app')
  })

  test('Every change is audited with previous and new values and shown on no screen', async ({ auth, contactPreference, joinWaitlist }) => {
    await describeCase({
      id: 'TC-US013-010',
      feature: 'US-013 Set or change how I am contacted',
      story: 'The change history is recorded and not displayed',
      severity: 'normal',
      tag: 'positive',
    })
    await auth.signInAs('inApp1')
    await contactPreference.changePreferenceTo('Telephone')
    await contactPreference.changePreferenceTo('In-app')

    const rows = readPreferenceAudit()
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ actor_type: 'patient', previous_value: 'in_app', new_value: 'telephone' })
    expect(rows[1]).toMatchObject({ actor_type: 'patient', previous_value: 'telephone', new_value: 'in_app' })
    expect(rows[1]!.at >= rows[0]!.at).toBe(true)

    await expect(contactPreference.getCurrentPreference('In-app')).toBeVisible()
    await expect(contactPreference.getCurrentPreference('Telephone')).toHaveCount(0)
    await expect(joinWaitlist.getJoinButton()).toBeVisible()
  })

  test('When the preference is written twice, the later value is the one used', async ({ api, auth, addPatient, contactPreference, respondToOffer, viewWaitlist }) => {
    await describeCase({
      id: 'TC-BR020-001',
      feature: 'BR-020 Which write applies',
      story: 'The most recent write applies',
      severity: 'normal',
      tag: 'positive',
    })
    const ana = actor('noPref1')
    await auth.signInAs('staff1')
    await addPatient.addPatient(ana.name, 'Telephone')
    await expect(viewWaitlist.getContactPreferenceCell(ana.name)).toHaveText('Telephone')

    await auth.signInAs('noPref1')
    await contactPreference.changePreferenceTo('In-app')

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getContactPreferenceCell(ana.name)).toHaveText('In-app')
    const released = await api.release(await api.tokenFor('staff1'), toIso(nextSlot()))
    expect(released.status).toBe(201)

    await auth.signInAs('noPref1')
    await expect(respondToOffer.getBanner()).toBeVisible()
    await auth.signInAs('staff1')
    await expect(viewWaitlist.getRequiresCallFlag(ana.name)).toHaveCount(0)
  })
})
