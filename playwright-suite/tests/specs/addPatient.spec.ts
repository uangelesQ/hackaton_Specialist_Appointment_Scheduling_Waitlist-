import { test, expect } from '../fixtures/baseTest'
import testData from '../data/testData.json'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'

test.describe('Staff add a patient on their behalf', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test.fixme('Staff add a registered telephone patient and the preference is shown', async ({ api, auth, addPatient, viewWaitlist }) => {
    // Blocked: contact preference and add messages are not built (OpenSpec tasks 1.3, 5.4, 5.6)
    await describeCase({
      id: 'TC-US006-001',
      feature: 'US-006 Add a patient on their behalf',
      story: 'BR-004, contact preference shown',
      severity: 'critical',
      tag: 'positive',
    })
    await api.seedWaiting(['telephone1', 'notRecorded1'])
    const jorge = actor('telephone2')

    await auth.signInAs('staff1')
    await addPatient.addPatient(jorge.name)
    await expect(addPatient.getAddConfirmation(jorge.name)).toBeVisible()
    await expect(viewWaitlist.getContactPreferenceCell(jorge.name)).toHaveText('Telephone')

    await addPatient.addPatient(jorge.name)
    await expect(addPatient.getAlreadyOnWaitlistMessage(jorge.name)).toBeVisible()
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
})
