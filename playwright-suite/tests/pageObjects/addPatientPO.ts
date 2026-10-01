import { type Locator, type Page } from '@playwright/test'

export class AddPatientPO {
  constructor(private readonly page: Page) {}

  getPatientPicker(): Locator {
    return this.page.getByRole('combobox', { name: 'Patient to add' })
  }

  getAddButton(): Locator {
    return this.page.getByRole('button', { name: 'Add to waitlist' })
  }

  // Not built yet: these messages come from the OpenSpec change, not from the current app
  getAddConfirmation(name: string): Locator {
    return this.page.getByText(`${name} added to the waitlist`)
  }

  getAlreadyOnWaitlistMessage(name: string): Locator {
    return this.page.getByText(`${name} is already on the waitlist`)
  }

  async addPatient(name: string): Promise<void> {
    await this.getPatientPicker().selectOption({ label: name })
    await this.getAddButton().click()
  }
}
