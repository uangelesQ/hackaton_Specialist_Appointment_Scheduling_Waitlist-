import { type APIRequestContext } from '@playwright/test'
import { resetPreferences } from './dbHelper'
import { apiUrl } from './env'
import { actor, type Actor, type ActorAlias } from './actors'
import { addLegacyWaitingEntry } from './e2eDb'

export interface ApiResult<T = any> {
  status: number
  body: T
}

interface UserSummary {
  id: number
  name: string
}

interface StaffEntry {
  id: number
  patientId: number
  patientName: string
  status: string
  position: number
  contactPreference: string | null
}

export interface StaffWaitlist {
  entries: StaffEntry[]
  offer: { id: number; entryId: number; slotStartsAt: string; requiresCall?: boolean } | null
  release: { available: boolean; reason: string | null; openSlotStartsAt: string | null }
}

type Method = 'get' | 'post' | 'put' | 'delete'

/** A route that does not exist answers with text, not JSON. */
function parseBody(text: string): any {
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export class ApiHelper {
  private users?: { patients: UserSummary[]; staff: UserSummary[] }

  constructor(private readonly request: APIRequestContext) {}

  async send(method: Method, path: string, token?: string, data?: object): Promise<ApiResult> {
    const response = await this.request[method](`${apiUrl}${path}`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      data,
    })
    const text = await response.text()
    return { status: response.status(), body: parseBody(text) }
  }

  async idOf(who: Actor): Promise<number> {
    if (!this.users) this.users = (await this.send('get', '/demo/users')).body
    const list = who.role === 'patient' ? this.users?.patients : this.users?.staff
    const found = list?.find((user) => user.name === who.name)
    if (!found) throw new Error(`${who.name} is not a seeded ${who.role}`)
    return found.id
  }

  async tokenFor(alias: ActorAlias): Promise<string> {
    const who = actor(alias)
    const result = await this.send('post', '/demo/login', undefined, { role: who.role, id: await this.idOf(who) })
    return result.body.token
  }

  async join(alias: ActorAlias): Promise<ApiResult> {
    return this.send('post', '/waitlist', await this.tokenFor(alias))
  }

  async addPatient(staffToken: string, alias: ActorAlias, contactPreference?: string): Promise<ApiResult> {
    return this.send('post', `/waitlist/patients/${await this.idOf(actor(alias))}`, staffToken, contactPreference ? { contactPreference } : undefined)
  }

  async setPreference(token: string, contactPreference: string): Promise<ApiResult> {
    return this.send('put', '/me/contact-preference', token, { contactPreference })
  }

  async me(token: string): Promise<ApiResult> {
    return this.send('get', '/me/waitlist', token)
  }

  async register(name: string, contactPreference?: string): Promise<ApiResult> {
    return this.send('post', '/demo/register', undefined, { name, contactPreference })
  }

  async release(staffToken: string, startsAtIso?: string): Promise<ApiResult> {
    return this.send('post', '/offers', staffToken, startsAtIso ? { startsAt: startsAtIso } : {})
  }

  async accept(token: string, offerId: number): Promise<ApiResult> {
    return this.send('post', `/offers/${offerId}/accept`, token)
  }

  async decline(token: string, offerId: number): Promise<ApiResult> {
    return this.send('post', `/offers/${offerId}/decline`, token)
  }

  async passOn(staffToken: string, offerId: number): Promise<ApiResult> {
    return this.send('post', `/offers/${offerId}/pass`, staffToken)
  }

  async recordAccepted(staffToken: string, offerId: number): Promise<ApiResult> {
    return this.send('post', `/offers/${offerId}/record-accept`, staffToken)
  }

  async recordDeclined(staffToken: string, offerId: number): Promise<ApiResult> {
    return this.send('post', `/offers/${offerId}/record-decline`, staffToken)
  }

  async staffWaitlist(staffToken: string): Promise<StaffWaitlist> {
    return (await this.send('get', '/waitlist', staffToken)).body
  }

  async removeEntry(staffToken: string, entryId: number): Promise<ApiResult> {
    return this.send('delete', `/waitlist/${entryId}`, staffToken)
  }

  /**
   * The actors join in order, so the first one is position 1. Staff add each one through the API, except an
   * actor with no recorded preference: the API refuses to create an entry for them (PS-001 v2.5, BR-014), so
   * they are put on the waitlist as a patient who was already waiting before a choice was required (BR-019).
   */
  async seedWaiting(aliases: ActorAlias[]): Promise<void> {
    const staffToken = await this.tokenFor('staff1')
    const staffId = await this.idOf(actor('staff1'))
    const patients: { name: string; contactPreference: string | null }[] = (await this.send('get', '/patients', staffToken)).body.patients

    for (const alias of aliases) {
      const who = actor(alias)
      const known = patients.find((patient) => patient.name === who.name)
      if (known && known.contactPreference === null) addLegacyWaitingEntry(who.name, staffId)
      else await this.addPatient(staffToken, alias)
    }
  }

  /** Leaves no outstanding offer, no active entry and the seeded preferences, and uses up a returned slot. */
  async restoreCleanState(): Promise<void> {
    const staffToken = await this.tokenFor('staff1')
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const view = await this.staffWaitlist(staffToken)
      if (!view.offer) break
      await this.passOn(staffToken, view.offer.id)
    }
    for (const entry of (await this.staffWaitlist(staffToken)).entries) await this.removeEntry(staffToken, entry.id)
    resetPreferences()
    await this.useUpReturnedSlot(staffToken)
    resetPreferences()
  }

  private async useUpReturnedSlot(staffToken: string): Promise<void> {
    if (!(await this.staffWaitlist(staffToken)).release.openSlotStartsAt) return
    const patients: { id: number; contactPreference: string | null }[] = (await this.send('get', '/patients', staffToken)).body.patients
    for (const patient of patients) {
      if (!patient.contactPreference) continue
      const added = await this.send('post', `/waitlist/patients/${patient.id}`, staffToken)
      if (added.status >= 400) continue
      const released = await this.release(staffToken)
      if (released.status === 201) {
        if (patient.contactPreference === 'telephone') {
          await this.recordAccepted(staffToken, released.body.offer.id)
        } else {
          const login = await this.send('post', '/demo/login', undefined, { role: 'patient', id: patient.id })
          await this.accept(login.body.token, released.body.offer.id)
        }
        return
      }
      await this.removeEntry(staffToken, added.body.entry.id)
    }
  }
}
