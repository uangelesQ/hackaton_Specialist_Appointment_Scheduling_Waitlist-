import { test, expect } from '../fixtures/baseTest'
import { describeCase } from '../helpers/allureMeta'
import { restartApi } from '../helpers/apiServer'

test.describe('Demo registration when demo login is off', () => {
  // This spec starts the suite API with demo login off, so the next spec file restarts it
  test.beforeAll(async () => {
    await restartApi({ demoLogin: false })
  })

  test('The registration request is rejected and creates nothing when demo login is off', async ({ api }) => {
    await describeCase({
      id: 'TC-A1-004',
      feature: 'Appendix A1 Demonstration registration',
      story: 'The step exists only in the demonstration environment',
      severity: 'normal',
      tag: 'negative',
    })
    const attempt = await api.register(`Sin Demo ${Date.now()}`, 'in_app')

    expect(attempt.status).toBeGreaterThanOrEqual(400)
    expect(attempt.body?.token).toBeUndefined()
  })

  test('The sign-in screen offers no registration form when demo login is off', async ({ page, signInPage }) => {
    // Defect: the form is always rendered, so this fails until the screen hides it
    test.fail()
    await describeCase({
      id: 'TC-A1-004',
      feature: 'Appendix A1 Demonstration registration',
      story: 'The step exists only in the demonstration environment',
      severity: 'normal',
      tag: 'negative',
      gap: 'defect',
    })
    await page.goto('/')
    await expect(signInPage.getSignInHeading()).toBeVisible()

    await expect(signInPage.getRegisterHeading()).toHaveCount(0)
  })
})
