import type { Knex } from 'knex';

const migrations: Record<string, Knex.Migration> = {
  '001_people': {
    async up(db) {
      await db.schema.createTable('specialist', (t) => {
        t.increments('id');
        t.text('name').notNullable();
        t.text('clinic').notNullable();
      });
      await db.schema.createTable('patients', (t) => {
        t.increments('id');
        t.text('full_name').notNullable();
      });
      await db.schema.createTable('staff', (t) => {
        t.increments('id');
        t.text('full_name').notNullable();
        t.integer('specialist_id').notNullable().references('id').inTable('specialist');
      });
    },
    async down(db) {
      await db.schema.dropTable('staff');
      await db.schema.dropTable('patients');
      await db.schema.dropTable('specialist');
    },
  },
  '002_waitlist': {
    async up(db) {
      await db.schema.createTable('waitlist_entries', (t) => {
        t.increments('id');
        t.integer('patient_id').notNullable().references('id').inTable('patients');
        t.enu('status', ['waiting', 'notified', 'booked', 'removed']).notNullable();
        t.text('joined_at').notNullable();
        t.text('closed_at');
        t.enu('created_by_type', ['patient', 'staff']).notNullable();
        t.integer('created_by_id').notNullable();
      });
      // At most one active entry per patient; closed entries are history.
      await db.raw(
        `CREATE UNIQUE INDEX waitlist_entries_one_active_per_patient
         ON waitlist_entries (patient_id) WHERE status IN ('waiting', 'notified')`,
      );

      await db.schema.createTable('slots', (t) => {
        t.increments('id');
        t.text('starts_at').notNullable();
        t.enu('status', ['open', 'offered', 'booked']).notNullable();
      });

      await db.schema.createTable('slot_offers', (t) => {
        t.increments('id');
        t.integer('slot_id').notNullable().references('id').inTable('slots');
        t.integer('entry_id').notNullable().references('id').inTable('waitlist_entries');
        t.enu('status', ['outstanding', 'accepted', 'declined', 'passed_on', 'closed']).notNullable();
        t.text('created_at').notNullable();
        t.text('resolved_at');
        t.integer('released_by').notNullable().references('id').inTable('staff');
      });
      // Single specialist: at most one outstanding offer at any time (BR-007).
      await db.raw(
        `CREATE UNIQUE INDEX slot_offers_one_outstanding
         ON slot_offers (status) WHERE status = 'outstanding'`,
      );

      await db.schema.createTable('audit_log', (t) => {
        t.increments('id');
        t.text('action').notNullable();
        t.integer('entry_id').references('id').inTable('waitlist_entries');
        t.integer('slot_id').references('id').inTable('slots');
        t.enu('actor_type', ['patient', 'staff']).notNullable();
        t.integer('actor_id').notNullable();
        t.text('at').notNullable();
      });
    },
    async down(db) {
      await db.schema.dropTable('audit_log');
      await db.schema.dropTable('slot_offers');
      await db.schema.dropTable('slots');
      await db.schema.dropTable('waitlist_entries');
    },
  },
};

// Migrations are registered in code so they work the same under tsx, vitest and tsc output.
export const migrationSource: Knex.MigrationSource<string> = {
  getMigrations: async () => Object.keys(migrations).sort(),
  getMigrationName: (name) => name,
  getMigration: async (name) => {
    const migration = migrations[name];
    if (!migration) throw new Error(`Unknown migration ${name}`);
    return migration;
  },
};
