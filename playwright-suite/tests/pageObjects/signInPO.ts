import { type Locator, type Page } from '@playwright/test'

export type PreferenceOption = 'In-app' | 'Telephone'

export class SignInPO {
  constructor(private readonly page: Page) {}

  getSignInHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Sign in' })
  }

  getUserButton(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true })
  }

  getRegisterHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Register (demo)' })
  }

  getRegisterNameInput(): Locator {
    return this.page.getByLabel('Name')
  }

  getRegisterOption(option: PreferenceOption): Locator {
    return this.page.getByRole('radio', { name: option === 'In-app' ? /In-app/ : /Telephone/ })
  }

  getRegisterButton(): Locator {
    return this.page.getByRole('button', { name: 'Register', exact: true })
  }

  getAlert(): Locator {
    return this.page.getByRole('alert')
  }

  async open(): Promise<void> {
    await this.page.goto('/')
    await this.getSignInHeading().waitFor()
  }

  async signInAs(name: string): Promise<void> {
    await this.getUserButton(name).click()
  }

  async registerAs(name: string, option?: PreferenceOption): Promise<void> {
    await this.getRegisterNameInput().fill(name)
    if (option) await this.getRegisterOption(option).check()
    await this.getRegisterButton().click()
  }
}
