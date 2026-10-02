import { type Locator, type Page } from '@playwright/test'
import testData from '../data/testData.json'
import { type PreferenceOption } from './signInPO'

export class ContactPreferencePO {
  constructor(private readonly page: Page) {}

  getCardHeading(): Locator {
    return this.page.getByRole('heading', { name: 'How we contact you' })
  }

  getCurrentPreference(option: PreferenceOption): Locator {
    return this.page.getByText(option, { exact: true })
  }

  getNotChosenYet(): Locator {
    return this.page.getByText(testData.labels.notChosenYet, { exact: true })
  }

  getChooseButton(): Locator {
    return this.page.getByRole('button', { name: 'Choose', exact: true })
  }

  getChangeButton(): Locator {
    return this.page.getByRole('button', { name: 'Change', exact: true })
  }

  getSaveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save', exact: true })
  }

  getCancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Cancel', exact: true })
  }

  getOptionGroup(): Locator {
    return this.page.getByRole('radiogroup', { name: 'How should we contact you?' })
  }

  getOption(option: PreferenceOption): Locator {
    return this.page.getByRole('radio', { name: option === 'In-app' ? /In-app/ : /Telephone/ })
  }

  getJoinPrompt(): Locator {
    return this.page.getByText(testData.labels.joinChoicePrompt)
  }

  getConfirmAndJoinButton(): Locator {
    return this.page.getByRole('button', { name: 'Confirm and join' })
  }

  getSavedNotice(option: PreferenceOption): Locator {
    return this.page.getByText(`Contact preference saved: ${option}. You're on the waitlist.`)
  }

  getJoinFailedAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: testData.labels.joinFailedAlert })
  }

  async changePreferenceTo(option: PreferenceOption): Promise<void> {
    await this.getCardHeading().waitFor()
    if (await this.getChangeButton().isVisible()) await this.getChangeButton().click()
    else await this.getChooseButton().click()
    await this.getOption(option).check()
    await this.getSaveButton().click()
    await this.getSaveButton().waitFor({ state: 'detached' })
    await this.getCurrentPreference(option).waitFor()
  }

  async openJoinChoice(): Promise<void> {
    await this.page.getByRole('button', { name: 'Join waitlist' }).click()
    await this.getJoinPrompt().waitFor()
  }

  async chooseAndJoin(option: PreferenceOption): Promise<void> {
    await this.openJoinChoice()
    await this.getOption(option).check()
    await this.getConfirmAndJoinButton().click()
  }
}
