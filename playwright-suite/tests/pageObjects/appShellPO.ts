import { type Locator, type Page } from '@playwright/test'

export class AppShellPO {
  constructor(private readonly page: Page) {}

  getSignOutButton(): Locator {
    return this.page.getByRole('button', { name: 'Sign out' })
  }

  getSignedInLabel(name: string, role: 'patient' | 'staff'): Locator {
    return this.page.getByText(`Signed in as ${name} (${role})`)
  }

  async signOut(): Promise<void> {
    await this.getSignOutButton().click()
    await this.page.getByRole('heading', { name: 'Sign in' }).waitFor()
  }
}
