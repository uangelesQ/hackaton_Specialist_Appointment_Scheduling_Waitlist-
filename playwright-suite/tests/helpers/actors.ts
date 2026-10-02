import testData from '../data/testData.json'

export type ActorAlias = keyof typeof testData.actors

export interface Actor {
  alias: ActorAlias
  name: string
  role: 'patient' | 'staff'
}

export function actor(alias: ActorAlias): Actor {
  const found = testData.actors[alias]
  return { alias, name: found.name, role: found.role as Actor['role'] }
}
