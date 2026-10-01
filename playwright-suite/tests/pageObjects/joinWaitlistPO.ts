import { type Locator, type Page } from '@playwright/test'

export class JoinWaitlistPO {
  constructor(private readonly page: Page) {}

  getNotJoinedHeading(): Locator {
    return this.page.getByRole('heading', { name: "You're not on the waitlist yet" })
  }

  getJoinButton(): Locator {
    return this.page.getByRole('button', { name: 'Join waitlist' })
  }

  getOnWaitlistHeading(): Locator {
    return this.page.getByRole('heading', { name: "You're on the waitlist" })
  }

  getWaitingNotice(): Locator {
    return this.page.getByText("We'll notify you here the moment a slot opens")
  }

  getPositionBadge(): Locator {
    return this.page.getByText('Your place in line')
  }

  getLeaveButton(): Locator {
    return this.page.getByRole('button', { name: 'Leave waitlist' })
  }

  async joinWaitlist(): Promise<void> {
    await this.getJoinButton().click()
    await this.getOnWaitlistHeading().waitFor()
  }
}
