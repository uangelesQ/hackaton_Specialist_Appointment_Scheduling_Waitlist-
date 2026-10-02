import { type Locator, type Page } from '@playwright/test'
import testData from '../data/testData.json'

export class ViewWaitlistPO {
  constructor(private readonly page: Page) {}

  getEmptyMessage(): Locator {
    return this.page.getByText(testData.labels.emptyWaitlist)
  }

  getRowByPatient(name: string): Locator {
    return this.page.getByRole('row', { name })
  }

  getBodyRows(): Locator {
    return this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') })
  }

  // The table cells have no accessible names, so a known column is read by its index
  getPositionCell(name: string): Locator {
    return this.getRowByPatient(name).getByRole('cell').first()
  }

  getStatusCell(name: string): Locator {
    return this.getRowByPatient(name).getByRole('cell', { name: /^(Waiting|Notified|Booked)/ })
  }

  getColumnHeader(name: string): Locator {
    return this.page.getByRole('columnheader', { name })
  }

  getRemoveButton(name: string): Locator {
    return this.getRowByPatient(name).getByRole('button', { name: `Remove ${name}` })
  }

  getContactPreferenceCell(name: string): Locator {
    return this.getRowByPatient(name).getByRole('cell', { name: /^(In-app|Telephone|Not recorded)$/ })
  }

  getRequiresCallFlag(name: string): Locator {
    return this.getRowByPatient(name).getByText(testData.labels.requiresCall)
  }

  async readPatientOrder(): Promise<string[]> {
    const rows = this.getBodyRows()
    const count = await rows.count()
    const names: string[] = []
    for (let index = 0; index < count; index += 1) {
      names.push((await rows.nth(index).getByRole('cell').nth(1).innerText()).trim())
    }
    return names
  }
}
