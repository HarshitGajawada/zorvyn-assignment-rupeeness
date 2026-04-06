import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('financial_records', (table) => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));

    table
      .decimal('amount', 15, 2)
      .notNullable()
      .checkPositive('financial_records_amount_check');

    table
      .string('type', 10)
      .notNullable()
      .checkIn(['income', 'expense'], 'financial_records_type_check');

    table.string('category', 255).notNullable();
    table.date('date').notNullable();
    table.text('notes').nullable();

    table
      .uuid('created_by')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');

    table.timestamp('deleted_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Indexes
  await knex.schema.raw(
    'CREATE INDEX idx_records_date ON financial_records(date DESC)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_records_category ON financial_records(LOWER(category))'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_records_type ON financial_records(type)'
  );
  await knex.schema.raw(
    'CREATE INDEX idx_records_updated_at ON financial_records(updated_at DESC)'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('financial_records');
}
