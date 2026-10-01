import { ApiHelper } from './apiHelper'
import { toIso } from './slots'
import { type ActorAlias } from './actors'

export class WaitlistFlow {
  constructor(private readonly api: ApiHelper) {}

  /** Staff add the actors in order, release a slot, and return the offer and the staff token. */
  async seedAndRelease(waiting: ActorAlias[], slotLocal: string) {
    await this.api.seedWaiting(waiting)
    const staffToken = await this.api.tokenFor('staff1')
    const released = await this.api.release(staffToken, toIso(slotLocal))
    return { staffToken, offerId: released.body.offer.id as number, status: released.status }
  }
}
