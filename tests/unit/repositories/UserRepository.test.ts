import { UserRepository } from '../../../src/repositories/UserRepository'
import { ConflictError } from '../../../src/errors'
import { User, Role } from '../../../src/types'

// Mock the db module
jest.mock('../../../src/db', () => {
  const mockDb: any = jest.fn()
  mockDb.fn = { now: jest.fn(() => 'NOW()') }
  return { __esModule: true, default: mockDb }
})

import db from '../../../src/db'

const mockDb = db as jest.MockedFunction<any>

function makeChain(overrides: Record<string, jest.Mock> = {}) {
  const chain: any = {}
  const methods = ['insert', 'select', 'where', 'update', 'delete', 'first', 'returning']
  methods.forEach((m) => {
    chain[m] = overrides[m] ?? jest.fn(() => chain)
  })
  return chain
}

const sampleRow = {
  id: 'uuid-1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'admin' as Role,
  status: 'active' as const,
  password_hash: null,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
}

const sampleUser: User = {
  id: 'uuid-1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'admin',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('UserRepository', () => {
  let repo: UserRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new UserRepository()
  })

  describe('create', () => {
    it('inserts a user and returns mapped User', async () => {
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.create({
        username: 'alice',
        email: 'alice@example.com',
        role: 'admin',
      })

      expect(result).toEqual(sampleUser)
    })

    it('throws ConflictError on PostgreSQL unique constraint violation (code 23505)', async () => {
      const chain = makeChain({
        returning: jest.fn().mockRejectedValue({ code: '23505' }),
      })
      mockDb.mockReturnValue(chain)

      await expect(
        repo.create({ username: 'alice', email: 'alice@example.com', role: 'admin' })
      ).rejects.toBeInstanceOf(ConflictError)
    })

    it('re-throws non-conflict DB errors', async () => {
      const dbError = new Error('connection lost')
      const chain = makeChain({
        returning: jest.fn().mockRejectedValue(dbError),
      })
      mockDb.mockReturnValue(chain)

      await expect(
        repo.create({ username: 'alice', email: 'alice@example.com', role: 'admin' })
      ).rejects.toBe(dbError)
    })

    it('sets password_hash to null when not provided', async () => {
      let insertedData: any
      const chain = makeChain({
        insert: jest.fn((data) => {
          insertedData = data
          return chain
        }),
        returning: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      await repo.create({ username: 'alice', email: 'alice@example.com', role: 'viewer' })
      expect(insertedData.password_hash).toBeNull()
    })
  })

  describe('findAll', () => {
    it('returns all users mapped to camelCase', async () => {
      const chain = makeChain({
        select: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findAll()
      expect(result).toEqual([sampleUser])
    })

    it('returns empty array when no users exist', async () => {
      const chain = makeChain({
        select: jest.fn().mockResolvedValue([]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findAll()
      expect(result).toEqual([])
    })
  })

  describe('findById', () => {
    it('returns mapped User when found', async () => {
      const chain = makeChain({
        first: jest.fn().mockResolvedValue(sampleRow),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findById('uuid-1')
      expect(result).toEqual(sampleUser)
    })

    it('returns null when user not found', async () => {
      const chain = makeChain({
        first: jest.fn().mockResolvedValue(undefined),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('returns updated User when found', async () => {
      const updatedRow = { ...sampleRow, role: 'analyst' as Role }
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([updatedRow]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.update('uuid-1', { role: 'analyst' })
      expect(result?.role).toBe('analyst')
    })

    it('returns null when user not found', async () => {
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.update('nonexistent', { role: 'viewer' })
      expect(result).toBeNull()
    })

    it('includes updated_at: NOW() in the update payload', async () => {
      let updatedData: any
      const chain = makeChain({
        update: jest.fn((data) => {
          updatedData = data
          return chain
        }),
        returning: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      await repo.update('uuid-1', { status: 'inactive' })
      expect(updatedData.updated_at).toBe('NOW()')
    })
  })

  describe('delete', () => {
    it('returns true when user was deleted', async () => {
      const chain = makeChain({
        delete: jest.fn().mockResolvedValue(1),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.delete('uuid-1')
      expect(result).toBe(true)
    })

    it('returns false when user not found', async () => {
      const chain = makeChain({
        delete: jest.fn().mockResolvedValue(0),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.delete('nonexistent')
      expect(result).toBe(false)
    })
  })
})
