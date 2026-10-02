import { type Locator, type Page } from '@playwright/test'
import testData from '../data/testData.json'

export class RespondToOfferPO {
  constructor(private readonly page: Page) {}

  getBanner(): Locator {
    return this.page.getByText(testData.labels.bannerText)
  }

  getAcceptButton(): Locator {
    return this.page.getByRole('button', { name: 'Accept' })
  }

  getDeclineButton(): Locator {
    return this.page.getByRole('button', { name: 'Decline' })
  }

  getSpecialistText(): Locator {
    return this.page.getByText(`With ${testData.specialist}`)
  }

  getSlotText(clock: string): Locator {
    return this.page.getByText(clock)
  }

  getConfirmDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Book this appointment?' })
  }

  getConfirmButton(): Locator {
    return this.getConfirmDialog().getByRole('button', { name: 'Confirm' })
  }

  getCancelButton(): Locator {
    return this.getConfirmDialog().getByRole('button', { name: 'Cancel' })
  }

  getBookedHeading(): Locator {
    return this.page.getByRole('heading', { name: "You're booked" })
  }

  getContactOfficeNote(): Locator {
    return this.page.getByText('Contact the office')
  }

  getTelephoneHolderNotice(): Locator {
    return this.page.getByText(testData.labels.telephoneHolderNotice)
  }

  getStaffWillRecordAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: testData.labels.staffWillRecordAlert })
  }

  getOfferUnavailableAlert(): Locator {
    return this.page.getByText(testData.labels.offerNoLongerAvailable)
  }

  async acceptOffer(): Promise<void> {
    await this.getAcceptButton().click()
    await this.getConfirmButton().click()
    await this.getBookedHeading().waitFor()
  }

  async declineOffer(): Promise<void> {
    await this.getDeclineButton().click()
    await this.getDeclineButton().waitFor({ state: 'detached' })
  }
}
