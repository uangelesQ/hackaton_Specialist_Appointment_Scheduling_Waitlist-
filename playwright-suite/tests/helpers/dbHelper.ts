import { execFileSync } from 'node:child_process'
import testData from '../data/testData.json'
import { actor, type ActorAlias } from './actors'
import { e2eDbFile } from './env'

export interface AuditRow {
  id: number
  action: string
  entry_id: number | null
  slot_id: number | null
  actor_type: string
  actor_id: number
  at: string
  patient_id: number | null
  previous_value: string | null
  new_value: string | null
}

const quote = (value: string): string => `'${value.replaceAll("'", "''")}'`

/** Reads the suite database with the sqlite3 command, because the app has no audit screen. */
export function readAudit(action?: string): AuditRow[] {
  const where = action ? `WHERE action = ${quote(action)}` : ''
  const output = execFileSync('sqlite3', ['-json', e2eDbFile, `SELECT * FROM audit_log ${where} ORDER BY id`]).toString().trim()
  return output ? (JSON.parse(output) as AuditRow[]) : []
}

export function readPreferenceAudit(): AuditRow[] {
  return readAudit('contact_preference_set')
}

/** Puts every seeded patient back to the seeded contact preference and clears the preference audit rows. */
export function resetPreferences(): void {
  const statements = (Object.entries(testData.baselinePreferences) as [ActorAlias, string | null][]).map(([alias, preference]) => {
    const value = preference === null ? 'NULL' : quote(preference)
    return `UPDATE patients SET contact_preference = ${value} WHERE full_name = ${quote(actor(alias).name)};`
  })
  statements.push("DELETE FROM audit_log WHERE action = 'contact_preference_set';")
  execFileSync('sqlite3', [e2eDbFile, statements.join(' ')])
}
