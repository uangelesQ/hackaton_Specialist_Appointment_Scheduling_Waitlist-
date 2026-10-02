import { type Locator, type Page } from '@playwright/test'
import { type PreferenceOption } from './signInPO'

export class AddPatientPO {
  constructor(private readonly page: Page) {}

  getPatientPicker(): Locator {
    return this.page.getByRole('combobox', { name: 'Patient to add' })
  }

  getContactPreferenceSelect(): Locator {
    return this.page.getByRole('combobox', { name: 'Contact preference' })
  }

  getAddButton(): Locator {
    return this.page.getByRole('button', { name: 'Add to waitlist' })
  }

  getAddConfirmation(name: string, option: PreferenceOption): Locator {
    return this.page.getByRole('status').filter({ hasText: `${name} was added to the waitlist. Contact preference: ${option}.` })
  }

  async selectPatient(name: string): Promise<void> {
    await this.getPatientPicker().selectOption({ label: name })
  }

  async addPatient(name: string, preference?: PreferenceOption): Promise<void> {
    await this.selectPatient(name)
    if (preference) await this.getContactPreferenceSelect().selectOption({ label: preference })
    await this.getAddButton().click()
  }
}
