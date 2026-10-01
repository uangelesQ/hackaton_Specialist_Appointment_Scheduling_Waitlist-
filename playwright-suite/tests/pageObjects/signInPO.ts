import { type Locator, type Page } from '@playwright/test'

export class SignInPO {
  constructor(private readonly page: Page) {}

  getSignInHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Sign in' })
  }

  getUserButton(name: string): Locator {
    return this.page.getByRole('button', { name })
  }

  async open(): Promise<void> {
    await this.page.goto('/')
    await this.getSignInHeading().waitFor()
  }

  async signInAs(name: string): Promise<void> {
    await this.getUserButton(name).click()
  }
}
