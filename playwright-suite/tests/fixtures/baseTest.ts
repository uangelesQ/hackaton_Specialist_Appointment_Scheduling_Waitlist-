import { test as base } from '@playwright/test'
import { ApiHelper } from '../helpers/apiHelper'
import { AuthHelper } from '../helpers/authHelper'
import { WaitlistFlow } from '../helpers/waitlistFlow'
import { AddPatientPO } from '../pageObjects/addPatientPO'
import { AppShellPO } from '../pageObjects/appShellPO'
import { JoinWaitlistPO } from '../pageObjects/joinWaitlistPO'
import { RecordPhoneResponsePO } from '../pageObjects/recordPhoneResponsePO'
import { ReleaseSlotPO } from '../pageObjects/releaseSlotPO'
import { RespondToOfferPO } from '../pageObjects/respondToOfferPO'
import { ViewWaitlistPO } from '../pageObjects/viewWaitlistPO'

type Fixtures = {
  api: ApiHelper
  auth: AuthHelper
  flow: WaitlistFlow
  appShell: AppShellPO
  joinWaitlist: JoinWaitlistPO
  addPatient: AddPatientPO
  viewWaitlist: ViewWaitlistPO
  releaseSlot: ReleaseSlotPO
  respondToOffer: RespondToOfferPO
  recordPhoneResponse: RecordPhoneResponsePO
}

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await use(new ApiHelper(request))
  },
  auth: async ({ page }, use) => {
    await use(new AuthHelper(page))
  },
  flow: async ({ api }, use) => {
    await use(new WaitlistFlow(api))
  },
  appShell: async ({ page }, use) => {
    await use(new AppShellPO(page))
  },
  joinWaitlist: async ({ page }, use) => {
    await use(new JoinWaitlistPO(page))
  },
  addPatient: async ({ page }, use) => {
    await use(new AddPatientPO(page))
  },
  viewWaitlist: async ({ page }, use) => {
    await use(new ViewWaitlistPO(page))
  },
  releaseSlot: async ({ page }, use) => {
    await use(new ReleaseSlotPO(page))
  },
  respondToOffer: async ({ page }, use) => {
    await use(new RespondToOfferPO(page))
  },
  recordPhoneResponse: async ({ page }, use) => {
    await use(new RecordPhoneResponsePO(page))
  },
})

export { expect } from '@playwright/test'
