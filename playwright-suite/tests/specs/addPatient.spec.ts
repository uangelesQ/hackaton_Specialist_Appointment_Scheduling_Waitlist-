import { test, expect } from '../fixtures/baseTest'
import testData from '../data/testData.json'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { readPreferenceAudit } from '../helpers/dbHelper'

test.describe('Staff add a patient on their behalf', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test('Staff add a registered telephone patient and the preference is shown', async ({ api, auth, addPatient, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US006-001',
      feature: 'US-006 Add a patient on their behalf',
      story: 'BR-004, contact preference shown',
      severity: 'critical',
      tag: 'positive',
    })
    await api.seedWaiting(['telephone1'])
    const jorge = actor('telephone2')

    await auth.signInAs('staff1')
    await addPatient.addPatient(jorge.name)
    await expect(addPatient.getAddConfirmation(jorge.name, 'Telephone')).toBeVisible()
    await expect(viewWaitlist.getContactPreferenceCell(jorge.name)).toHaveText('Telephone')

    const again = await api.addPatient(await api.tokenFor('staff1'), 'telephone2')
    expect(again.status).toBe(200)
    expect(again.body.created).toBe(false)
  })

  test('Staff cannot add a person who is not registered, and nothing is created', async ({ api }) => {
    await describeCase({
      id: 'TC-US006-002',
      feature: 'US-006 Add a patient on their behalf',
      story: 'Unregistered caller is not added',
      severity: 'critical',
      tag: 'negative',
    })
    await api.seedWaiting(['telephone1'])
    const staffToken = await api.tokenFor('staff1')

    const attempt = await api.send('post', `/waitlist/patients/${testData.unregisteredPatientId}`, staffToken)
    expect(attempt.status).toBe(404)
    expect(attempt.body.error).toBe('patient_not_found')

    const patients: { id: number }[] = (await api.send('get', '/patients', staffToken)).body.patients
    expect(patients.some((patient) => patient.id === testData.unregisteredPatientId)).toBe(false)
    const view = await api.staffWaitlist(staffToken)
    expect(view.entries.map((entry) => entry.patientName)).toEqual([actor('telephone1').name])
  })

  test('Staff are asked to record a preference before adding a caller who has none', async ({ api, auth, addPatient, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US006-003',
      feature: 'US-006 Add a patient on their behalf',
      story: 'BR-014, BR-016 a caller with no preference needs one recorded first',
      severity: 'critical',
      tag: 'negative',
    })
    const staffToken = await api.tokenFor('staff1')

    await auth.signInAs('staff1')
    await addPatient.selectPatient(actor('noPref1').name)
    await expect(addPatient.getContactPreferenceSelect()).toBeVisible()
    await expect(addPatient.getAddButton()).toBeDisabled()

    const attempt = await api.addPatient(staffToken, 'noPref1')
    expect(attempt.status).toBe(409)
    expect(attempt.body.error).toBe('preference_required')
    await expect(viewWaitlist.getEmptyMessage()).toBeVisible()
  })

  test('Staff record the caller stated choice while adding, and it is attributed to the staff member', async ({ auth, addPatient, viewWaitlist, contactPreference }) => {
    await describeCase({
      id: 'TC-US006-004',
      feature: 'US-006 Add a patient on their behalf',
      story: 'BR-016 staff record the stated choice when adding',
      severity: 'critical',
      tag: 'positive',
    })
    const ana = actor('noPref1')

    await auth.signInAs('staff1')
    await addPatient.addPatient(ana.name, 'Telephone')
    await expect(addPatient.getAddConfirmation(ana.name, 'Telephone')).toBeVisible()
    await expect(viewWaitlist.getStatusCell(ana.name)).toContainText('Waiting')
    await expect(viewWaitlist.getContactPreferenceCell(ana.name)).toHaveText('Telephone')

    const rows = readPreferenceAudit()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ actor_type: 'staff', previous_value: null, new_value: 'telephone' })
    expect(rows[0]?.entry_id).not.toBeNull()
    expect(rows[0]?.at).toBeTruthy()

    await auth.signInAs('noPref1')
    await expect(contactPreference.getCurrentPreference('Telephone')).toBeVisible()
  })

  test('Staff cannot change a preference that is already recorded', async ({ api, auth, addPatient, viewWaitlist }) => {
    await describeCase({
      id: 'TC-US006-005',
      feature: 'US-006 Add a patient on their behalf',
      story: 'BR-016 staff cannot change a recorded preference',
      severity: 'critical',
      tag: 'permission',
    })
    const jorge = actor('telephone2')
    const staffToken = await api.tokenFor('staff1')

    await auth.signInAs('staff1')
    await addPatient.selectPatient(jorge.name)
    await expect(addPatient.getContactPreferenceSelect()).toHaveCount(0)
    await expect(addPatient.getAddButton()).toBeEnabled()

    const refused = await api.addPatient(staffToken, 'telephone2', 'in_app')
    expect(refused.status).toBe(409)
    expect(refused.body.error).toBe('preference_already_recorded')
    expect((await api.staffWaitlist(staffToken)).entries).toHaveLength(0)

    await addPatient.getAddButton().click()
    await expect(viewWaitlist.getContactPreferenceCell(jorge.name)).toHaveText('Telephone')
  })
})
