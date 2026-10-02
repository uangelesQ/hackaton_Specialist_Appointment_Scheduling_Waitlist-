import { type Locator, type Page } from '@playwright/test'
import testData from '../data/testData.json'

export class RecordPhoneResponsePO {
  constructor(private readonly page: Page) {}

  getRecordAcceptedButton(): Locator {
    return this.page.getByRole('button', { name: testData.labels.recordAccepted })
  }

  getRecordDeclinedButton(): Locator {
    return this.page.getByRole('button', { name: testData.labels.recordDeclined })
  }

  getCannotRecordAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: testData.labels.staffCannotRecordAlert })
  }

  async recordAccepted(): Promise<void> {
    await this.getRecordAcceptedButton().click()
  }

  async recordDeclined(): Promise<void> {
    await this.getRecordDeclinedButton().click()
  }
}
