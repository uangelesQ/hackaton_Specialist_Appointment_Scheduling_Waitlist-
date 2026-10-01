import testData from '../data/testData.json'
import { seedProfile } from './env'

export type ActorAlias = keyof typeof testData.profiles.current

export interface Actor {
  alias: ActorAlias
  name: string
  role: 'patient' | 'staff'
}

export function actor(alias: ActorAlias): Actor {
  const found = testData.profiles[seedProfile][alias]
  return { alias, name: found.name, role: found.role as Actor['role'] }
}
