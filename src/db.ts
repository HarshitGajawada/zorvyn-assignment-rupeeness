import knex from 'knex'
import knexConfig from '../knexfile'

const env = process.env.NODE_ENV ?? 'development'

const db = knex(knexConfig[env])

export default db

export async function checkDatabaseConnection(): Promise<void> {
  try {
    await db.raw('SELECT 1')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[db] Failed to connect to the database (env: ${env}): ${message}`)
    process.exit(1)
  }
}
