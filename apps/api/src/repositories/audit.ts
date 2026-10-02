import type { Knex } from 'knex';
import type { ActorType, AuditRecord, Clock } from './types.js';

interface AuditRow {
  id: number;
  action: string;
  entry_id: number | null;
  slot_id: number | null;
  actor_type: ActorType;
  actor_id: number;
  at: string;
  patient_id: number | null;
  previous_value: string | null;
  new_value: string | null;
}

const toRecord = (row: AuditRow): AuditRecord => ({
  id: row.id,
  action: row.action,
  entryId: row.entry_id,
  slotId: row.slot_id,
  actorType: row.actor_type,
  actorId: row.actor_id,
  at: row.at,
  patientId: row.patient_id,
  previousValue: row.previous_value,
  newValue: row.new_value,
});

export function auditRepository(db: Knex | Knex.Transaction, clock: Clock) {
  const table = () => db<AuditRow>('audit_log');

  return {
    async record(input: {
      action: string;
      entryId?: number | null;
      slotId?: number | null;
      actorType: ActorType;
      actorId: number;
      patientId?: number | null;
      previousValue?: string | null;
      newValue?: string | null;
    }): Promise<void> {
      await table().insert({
        action: input.action,
        entry_id: input.entryId ?? null,
        slot_id: input.slotId ?? null,
        actor_type: input.actorType,
        actor_id: input.actorId,
        at: clock(),
        patient_id: input.patientId ?? null,
        previous_value: input.previousValue ?? null,
        new_value: input.newValue ?? null,
      });
    },

    async list(): Promise<AuditRecord[]> {
      const rows = await table().orderBy('id');
      return rows.map(toRecord);
    },
  };
}
