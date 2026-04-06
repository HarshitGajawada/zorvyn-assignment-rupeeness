import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('users', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));

    table.string('username', 255).notNullable().unique();
    table.string('email', 255).notNullable().unique();

    table
      .string('role', 20)
      .notNullable()
      .checkIn(['viewer', 'analyst', 'admin'], 'users_role_check');

    table
      .string('status', 20)
      .notNullable()
      .defaultTo('active')
      .checkIn(['active', 'inactive'], 'users_status_check');

    table.string('password_hash', 255).nullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
