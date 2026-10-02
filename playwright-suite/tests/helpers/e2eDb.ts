import { createRequire } from 'node:module'
import path from 'node:path'
import { e2eDbFile, repoRoot } from './env'

/**
 * Only what this file needs from better-sqlite3, which the repo's API already depends on.
 * Loaded from the repo root so the suite adds no dependency of its own.
 */
interface Statement {
  get(...args: unknown[]): unknown
  run(...args: unknown[]): { lastInsertRowid: number | bigint }
}
interface Database {
  prepare(sql: string): Statement
  transaction<T>(work: () => T): () => T
  pragma(source: string): unknown
  close(): void
}
type DatabaseConstructor = new (file: string) => Database

const requireFromRepo = createRequire(path.join(repoRoot, 'package.json'))

/**
 * Puts a patient who has no recorded preference on the waitlist, the way the app's own demo seed does.
 *
 * The API no longer lets anyone create an entry for such a patient (PS-001 v2.5, BR-014), but one can
 * still be waiting: they joined before a choice was required (BR-019). That state cannot be built
 * through the API, so the suite writes it straight into its own database file. It never touches the
 * demo database: `e2eDbFile` is the file only this suite's API uses.
 */
export function addLegacyWaitingEntry(patientName: string, staffId: number): void {
  const Database = requireFromRepo('better-sqlite3') as DatabaseConstructor
  const db = new Database(e2eDbFile)
  try {
    db.pragma('busy_timeout = 5000')
    db.transaction(() => {
      const patient = db.prepare('SELECT id, contact_preference AS preference FROM patients WHERE full_name = ?').get(patientName) as
        | { id: number; preference: string | null }
        | undefined
      if (!patient) throw new Error(`${patientName} is not a seeded patient`)
      if (patient.preference !== null) throw new Error(`${patientName} has a recorded preference, so staff can add them through the API`)

      const now = new Date().toISOString()
      const entry = db
        .prepare(
          `INSERT INTO waitlist_entries (patient_id, status, joined_at, created_by_type, created_by_id)
           VALUES (?, 'waiting', ?, 'staff', ?)`,
        )
        .run(patient.id, now, staffId)
      db.prepare(
        `INSERT INTO audit_log (action, entry_id, actor_type, actor_id, at) VALUES ('entry_created', ?, 'staff', ?, ?)`,
      ).run(entry.lastInsertRowid, staffId, now)
    })()
  } finally {
    db.close()
  }
}
