import 'dotenv/config'
import bcrypt from 'bcryptjs'
import knex from 'knex'
import knexConfig from './knexfile'

const db = knex(knexConfig['development'])

async function seed() {
  const hash = await bcrypt.hash('admin123', 10)
  await db('users').insert({
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    password_hash: hash,
  })
  console.log('Admin user created: admin / admin123')
  await db.destroy()
}

seed().catch(e => { console.error(e); process.exit(1) })
