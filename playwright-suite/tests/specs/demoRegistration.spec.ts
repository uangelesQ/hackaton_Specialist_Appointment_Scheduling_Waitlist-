import { test, expect } from '../fixtures/baseTest'
import { actor } from '../helpers/actors'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'
import { readPreferenceAudit } from '../helpers/dbHelper'
import testData from '../data/testData.json'

test.describe('Demo registration on the sign-in screen', () => {
  // Each spec file starts on a fresh suite database
  test.beforeAll(async () => {
    await restartApi()
  })

  test.afterEach(async ({ api }) => {
    await api.restoreCleanState()
  })

  test('Registering creates a patient with the chosen preference and signs them in without asking again when joining', async ({ auth, signInPage, appShell, contactPreference, joinWaitlist, viewWaitlist }) => {
    await describeCase({
      id: 'TC-A1-001',
      feature: 'Appendix A1 Demonstration registration',
      story: 'A person registers, is signed in, and joins without a second choice',
      severity: 'normal',
      tag: 'positive',
    })
    const name = `Lucía Fernández ${Date.now()}`
    await auth.openSignInScreen()
    await expect(signInPage.getRegisterHeading()).toBeVisible()
    await signInPage.registerAs(name, 'Telephone')

    await expect(appShell.getSignedInLabel(name, 'patient')).toBeVisible()
    await expect(contactPreference.getCurrentPreference('Telephone')).toBeVisible()
    await joinWaitlist.joinWaitlist()
    await expect(contactPreference.getJoinPrompt()).toHaveCount(0)

    await auth.signInAs('staff1')
    await expect(viewWaitlist.getContactPreferenceCell(name)).toHaveText('Telephone')
    const rows = readPreferenceAudit()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ actor_type: 'patient', previous_value: null, new_value: 'telephone' })
  })

  test('Registration needs a name and a preference', async ({ api, auth, signInPage }) => {
    await describeCase({
      id: 'TC-A1-002',
      feature: 'Appendix A1 Demonstration registration',
      story: 'Missing name or preference creates nothing',
      severity: 'normal',
      tag: 'negative',
    })
    const name = `Sin Datos ${Date.now()}`
    const staffToken = await api.tokenFor('staff1')
    const before = (await api.send('get', '/patients', staffToken)).body.patients.length

    await auth.openSignInScreen()
    await signInPage.registerAs('', 'In-app')
    await expect(signInPage.getAlert()).toHaveText(testData.labels.registerNameRequired)

    await signInPage.registerAs('   ', 'In-app')
    await expect(signInPage.getAlert()).toHaveText(testData.labels.registerNameRequired)

    await auth.openSignInScreen()
    await signInPage.registerAs(name)
    await expect(signInPage.getAlert()).toHaveText(testData.labels.registerPreferenceRequired)

    const patients: { name: string }[] = (await api.send('get', '/patients', staffToken)).body.patients
    expect(patients).toHaveLength(before)
    expect(patients.some((patient) => patient.name === name)).toBe(false)
  })

  test('A name already in use is refused', async ({ api, auth, signInPage }) => {
    await describeCase({
      id: 'TC-A1-003',
      feature: 'Appendix A1 Demonstration registration',
      story: 'A duplicate name is refused, including different case and spaces',
      severity: 'normal',
      tag: 'negative',
    })
    const maria = actor('inApp1')
    const staffToken = await api.tokenFor('staff1')
    const before = (await api.send('get', '/patients', staffToken)).body.patients.length

    await auth.openSignInScreen()
    await signInPage.registerAs(maria.name, 'Telephone')
    await expect(signInPage.getAlert()).toHaveText(testData.labels.nameAlreadyRegistered)

    await signInPage.registerAs(`  ${maria.name.toLowerCase()}  `, 'Telephone')
    await expect(signInPage.getAlert()).toHaveText(testData.labels.nameAlreadyRegistered)

    expect((await api.send('get', '/patients', staffToken)).body.patients).toHaveLength(before)
    expect((await api.me(await api.tokenFor('inApp1'))).body.contactPreference).toBe('in_app')
  })
})
