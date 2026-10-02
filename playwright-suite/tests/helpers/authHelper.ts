import { type Page } from '@playwright/test'
import { actor, type ActorAlias } from './actors'
import { AppShellPO } from '../pageObjects/appShellPO'
import { SignInPO } from '../pageObjects/signInPO'

export class AuthHelper {
  private readonly signIn: SignInPO
  private readonly shell: AppShellPO

  constructor(private readonly page: Page) {
    this.signIn = new SignInPO(page)
    this.shell = new AppShellPO(page)
  }

  /** Opens the app and signs in through the screen, signing out first if someone is signed in. */
  async signInAs(alias: ActorAlias): Promise<void> {
    const who = actor(alias)
    await this.openSignInScreen()
    await this.signIn.signInAs(who.name)
    await this.shell.getSignedInLabel(who.name, who.role).waitFor()
  }

  async openSignInScreen(): Promise<void> {
    if (await this.shell.getSignOutButton().isVisible()) await this.shell.signOut()
    else await this.signIn.open()
  }
}
