import db from '../db'
import { User, Role } from '../types'
import { ConflictError } from '../errors'

interface UserRow {
  id: string
  username: string
  email: string
  role: Role
  status: 'active' | 'inactive'
  password_hash: string | null
  created_at: Date
  updated_at: Date
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class UserRepository {
  async create(data: {
    username: string
    email: string
    role: Role
    passwordHash?: string
  }): Promise<User> {
    try {
      const [row] = await db('users')
        .insert({
          username: data.username,
          email: data.email,
          role: data.role,
          password_hash: data.passwordHash ?? null,
        })
        .returning('*')
      return rowToUser(row as UserRow)
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictError('A user with that email or username already exists')
      }
      throw err
    }
  }

  async findAll(): Promise<User[]> {
    const rows = await db('users').select('*')
    return (rows as UserRow[]).map(rowToUser)
  }

  async findById(id: string): Promise<User | null> {
    const row = await db('users').where({ id }).first()
    if (!row) return null
    return rowToUser(row as UserRow)
  }

  async update(
    id: string,
    data: Partial<{ role: Role; status: 'active' | 'inactive' }>
  ): Promise<User | null> {
    const [row] = await db('users')
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*')
    if (!row) return null
    return rowToUser(row as UserRow)
  }

  async delete(id: string): Promise<boolean> {
    const count = await db('users').where({ id }).delete()
    return count > 0
  }
}

export default new UserRepository()
