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
