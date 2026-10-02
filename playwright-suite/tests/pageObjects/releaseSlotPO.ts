import { type Locator, type Page } from '@playwright/test'
import testData from '../data/testData.json'

export class ReleaseSlotPO {
  constructor(private readonly page: Page) {}

  getSlotInput(): Locator {
    return this.page.getByLabel('Slot date and time')
  }

  getReleaseButton(): Locator {
    return this.page.getByRole('button', { name: testData.labels.releaseSlot })
  }

  getPassOnButton(): Locator {
    return this.page.getByRole('button', { name: testData.labels.passOn })
  }

  getWaitingOnText(name: string): Locator {
    return this.page.getByText(`Waiting on ${name}`)
  }

  getReturnedSlotText(): Locator {
    return this.page.getByText(testData.labels.returnedSlot)
  }

  getNoEligibleText(): Locator {
    return this.page.getByText(testData.labels.noEligible)
  }

  getTimeOutstanding(): Locator {
    return this.page.getByText(/Outstanding for/)
  }

  async releaseSlot(startsAt?: string): Promise<void> {
    if (startsAt) await this.getSlotInput().fill(startsAt)
    await this.getReleaseButton().click()
  }

  async passOnOffer(): Promise<void> {
    await this.getPassOnButton().click()
  }
}
