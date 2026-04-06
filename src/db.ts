import knex from 'knex'

const isProduction = process.env.NODE_ENV === 'production'

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.PG_HOST ?? 'localhost',
        port: Number(process.env.PG_PORT ?? 5432),
        database: process.env.PG_DATABASE ?? 'finance_dashboard',
        user: process.env.PG_USER ?? 'postgres',
        password: process.env.PG_PASSWORD ?? '',
      },
  pool: { min: 2, max: 10 },
})

export default db

export async function checkDatabaseConnection(): Promise<void> {
  try {
    await db.raw('SELECT 1')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[db] Failed to connect to the database: ${message}`)
    process.exit(1)
  }
}
