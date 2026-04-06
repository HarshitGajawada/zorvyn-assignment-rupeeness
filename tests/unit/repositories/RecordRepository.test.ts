import { RecordRepository } from '../../../src/repositories/RecordRepository'
import { FinancialRecord, RecordType } from '../../../src/types'

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
  const methods = [
    'insert', 'select', 'where', 'whereNull', 'whereNotNull', 'whereRaw',
    'update', 'delete', 'first', 'returning', 'orderBy',
    'count', 'limit', 'offset', 'clone',
  ]
  methods.forEach((m) => {
    chain[m] = overrides[m] ?? jest.fn(() => chain)
  })
  return chain
}

const sampleRow = {
  id: 'rec-uuid-1',
  amount: '150.00',
  type: 'income' as RecordType,
  category: 'Salary',
  date: '2024-03-15',
  notes: 'March salary',
  created_by: 'user-uuid-1',
  deleted_at: null,
  created_at: new Date('2024-03-15T10:00:00Z'),
  updated_at: new Date('2024-03-15T10:00:00Z'),
}

const sampleRecord: FinancialRecord = {
  id: 'rec-uuid-1',
  amount: 150,
  type: 'income',
  category: 'Salary',
  date: '2024-03-15',
  notes: 'March salary',
  createdBy: 'user-uuid-1',
  deletedAt: undefined,
  createdAt: new Date('2024-03-15T10:00:00Z'),
  updatedAt: new Date('2024-03-15T10:00:00Z'),
}

describe('RecordRepository', () => {
  let repo: RecordRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new RecordRepository()
  })

  describe('create', () => {
    it('inserts a record and returns mapped FinancialRecord', async () => {
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.create({
        amount: 150,
        type: 'income',
        category: 'Salary',
        date: '2024-03-15',
        notes: 'March salary',
        createdBy: 'user-uuid-1',
      })

      expect(result).toEqual(sampleRecord)
    })

    it('maps notes to undefined when null in DB', async () => {
      const rowWithoutNotes = { ...sampleRow, notes: null }
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([rowWithoutNotes]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.create({
        amount: 150,
        type: 'income',
        category: 'Salary',
        date: '2024-03-15',
        createdBy: 'user-uuid-1',
      })

      expect(result.notes).toBeUndefined()
    })

    it('inserts null for notes when not provided', async () => {
      let insertedData: any
      const chain = makeChain({
        insert: jest.fn((data) => {
          insertedData = data
          return chain
        }),
        returning: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      await repo.create({
        amount: 100,
        type: 'expense',
        category: 'Rent',
        date: '2024-03-01',
        createdBy: 'user-uuid-1',
      })

      expect(insertedData.notes).toBeNull()
    })

    it('converts amount string from DB to number', async () => {
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([{ ...sampleRow, amount: '99.99' }]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.create({
        amount: 99.99,
        type: 'expense',
        category: 'Food',
        date: '2024-03-10',
        createdBy: 'user-uuid-1',
      })

      expect(result.amount).toBe(99.99)
      expect(typeof result.amount).toBe('number')
    })
  })

  describe('findAll', () => {
    it('returns all non-deleted records ordered by date DESC', async () => {
      const chain = makeChain({
        select: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findAll()

      expect(result).toEqual({ records: [sampleRecord], total: 1, totalPages: 1 })
      expect(chain.whereNull).toHaveBeenCalledWith('deleted_at')
      expect(chain.orderBy).toHaveBeenCalledWith('date', 'desc')
    })

    it('returns empty array when no records exist', async () => {
      const chain = makeChain({
        select: jest.fn().mockResolvedValue([]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findAll()
      expect(result).toEqual({ records: [], total: 0, totalPages: 1 })
    })

    it('applies start_date filter', async () => {
      const whereCalls: any[] = []
      const chain = makeChain({
        where: jest.fn((...args) => {
          whereCalls.push(args)
          return chain
        }),
        select: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      await repo.findAll({ start_date: '2024-01-01' })

      expect(whereCalls).toContainEqual(['date', '>=', '2024-01-01'])
    })

    it('applies end_date filter', async () => {
      const whereCalls: any[] = []
      const chain = makeChain({
        where: jest.fn((...args) => {
          whereCalls.push(args)
          return chain
        }),
        select: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      await repo.findAll({ end_date: '2024-12-31' })

      expect(whereCalls).toContainEqual(['date', '<=', '2024-12-31'])
    })

    it('applies both start_date and end_date filters (inclusive range)', async () => {
      const whereCalls: any[] = []
      const chain = makeChain({
        where: jest.fn((...args) => {
          whereCalls.push(args)
          return chain
        }),
        select: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      await repo.findAll({ start_date: '2024-03-01', end_date: '2024-03-31' })

      expect(whereCalls).toContainEqual(['date', '>=', '2024-03-01'])
      expect(whereCalls).toContainEqual(['date', '<=', '2024-03-31'])
    })

    it('applies category filter using LOWER() for case-insensitive match', async () => {
      const whereRawCalls: any[] = []
      const chain = makeChain({
        whereRaw: jest.fn((...args) => {
          whereRawCalls.push(args)
          return chain
        }),
        select: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      await repo.findAll({ category: 'salary' })

      expect(whereRawCalls).toContainEqual(['LOWER(category) = LOWER(?)', ['salary']])
    })

    it('applies type filter', async () => {
      const whereCalls: any[] = []
      const chain = makeChain({
        where: jest.fn((...args) => {
          whereCalls.push(args)
          return chain
        }),
        select: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      await repo.findAll({ type: 'income' })

      expect(whereCalls).toContainEqual(['type', 'income'])
    })

    it('applies all filters simultaneously', async () => {
      const whereCalls: any[] = []
      const whereRawCalls: any[] = []
      const chain = makeChain({
        where: jest.fn((...args) => {
          whereCalls.push(args)
          return chain
        }),
        whereRaw: jest.fn((...args) => {
          whereRawCalls.push(args)
          return chain
        }),
        select: jest.fn().mockResolvedValue([]),
      })
      mockDb.mockReturnValue(chain)

      await repo.findAll({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        category: 'Rent',
        type: 'expense',
      })

      expect(whereCalls).toContainEqual(['date', '>=', '2024-01-01'])
      expect(whereCalls).toContainEqual(['date', '<=', '2024-12-31'])
      expect(whereCalls).toContainEqual(['type', 'expense'])
      expect(whereRawCalls).toContainEqual(['LOWER(category) = LOWER(?)', ['Rent']])
    })

    it('applies search filter using LOWER(category) LIKE or LOWER(notes) LIKE', async () => {
      const whereRawCalls: any[] = []
      const chain = makeChain({
        whereRaw: jest.fn((...args) => {
          whereRawCalls.push(args)
          return chain
        }),
        select: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      await repo.findAll({ search: 'salary' })

      expect(whereRawCalls).toContainEqual([
        'LOWER(category) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?)',
        ['%salary%', '%salary%'],
      ])
    })

    it('does not apply search filter when search is not provided', async () => {
      const whereRawCalls: any[] = []
      const chain = makeChain({
        whereRaw: jest.fn((...args) => {
          whereRawCalls.push(args)
          return chain
        }),
        select: jest.fn().mockResolvedValue([]),
      })
      mockDb.mockReturnValue(chain)

      await repo.findAll()

      const searchCalls = whereRawCalls.filter(([sql]) =>
        typeof sql === 'string' && sql.includes('LIKE')
      )
      expect(searchCalls).toHaveLength(0)
    })

    it('does not apply filters when none are provided', async () => {
      const whereRawCalls: any[] = []
      const whereCalls: any[] = []
      const chain = makeChain({
        where: jest.fn((...args) => {
          whereCalls.push(args)
          return chain
        }),
        whereRaw: jest.fn((...args) => {
          whereRawCalls.push(args)
          return chain
        }),
        select: jest.fn().mockResolvedValue([]),
      })
      mockDb.mockReturnValue(chain)

      await repo.findAll()

      // Only whereNull('deleted_at') should be called, no date/type/category filters
      expect(whereRawCalls).toHaveLength(0)
      expect(whereCalls).toHaveLength(0)
    })

    it('applies OFFSET=0 and LIMIT=10 for page=1, limit=10', async () => {
      let capturedLimit: number | undefined
      let capturedOffset: number | undefined
      const chain = makeChain({
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ count: '25' }),
        limit: jest.fn((n) => { capturedLimit = n; return chain }),
        offset: jest.fn((n) => { capturedOffset = n; return chain }),
        select: jest.fn().mockResolvedValue([sampleRow]),
        clone: jest.fn().mockReturnThis(),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findAll({ page: 1, limit: 10 })

      expect(capturedLimit).toBe(10)
      expect(capturedOffset).toBe(0)
      expect(result.total).toBe(25)
      expect(result.totalPages).toBe(3)
    })

    it('applies OFFSET=5 and LIMIT=5 for page=2, limit=5', async () => {
      let capturedLimit: number | undefined
      let capturedOffset: number | undefined
      const chain = makeChain({
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ count: '12' }),
        limit: jest.fn((n) => { capturedLimit = n; return chain }),
        offset: jest.fn((n) => { capturedOffset = n; return chain }),
        select: jest.fn().mockResolvedValue([sampleRow]),
        clone: jest.fn().mockReturnThis(),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findAll({ page: 2, limit: 5 })

      expect(capturedLimit).toBe(5)
      expect(capturedOffset).toBe(5)
      expect(result.total).toBe(12)
      expect(result.totalPages).toBe(3) // Math.ceil(12/5) = 3
    })

    it('calculates totalPages correctly using Math.ceil(total / limit)', async () => {
      const chain = makeChain({
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ count: '11' }),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue([]),
        clone: jest.fn().mockReturnThis(),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findAll({ page: 1, limit: 5 })

      expect(result.totalPages).toBe(3) // Math.ceil(11/5) = 3
    })

    it('returns total=records.length and totalPages=1 when no pagination params', async () => {
      const rows = [sampleRow, { ...sampleRow, id: 'rec-uuid-2' }]
      const chain = makeChain({
        select: jest.fn().mockResolvedValue(rows),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findAll()

      expect(result.total).toBe(2)
      expect(result.totalPages).toBe(1)
    })
  })

  describe('findById', () => {
    it('returns mapped FinancialRecord when found and not deleted', async () => {
      const chain = makeChain({
        first: jest.fn().mockResolvedValue(sampleRow),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findById('rec-uuid-1')

      expect(result).toEqual(sampleRecord)
      expect(chain.whereNull).toHaveBeenCalledWith('deleted_at')
    })

    it('returns null when record not found', async () => {
      const chain = makeChain({
        first: jest.fn().mockResolvedValue(undefined),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.findById('nonexistent')
      expect(result).toBeNull()
    })

    it('excludes soft-deleted records', async () => {
      const chain = makeChain({
        first: jest.fn().mockResolvedValue(undefined),
      })
      mockDb.mockReturnValue(chain)

      await repo.findById('deleted-rec')

      expect(chain.whereNull).toHaveBeenCalledWith('deleted_at')
    })
  })

  describe('update', () => {
    it('returns updated FinancialRecord when found', async () => {
      const updatedRow = { ...sampleRow, amount: '200.00', category: 'Bonus' }
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([updatedRow]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.update('rec-uuid-1', { amount: 200, category: 'Bonus' })

      expect(result?.amount).toBe(200)
      expect(result?.category).toBe('Bonus')
    })

    it('returns null when record not found', async () => {
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.update('nonexistent', { amount: 100 })
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

      await repo.update('rec-uuid-1', { category: 'Freelance' })

      expect(updatedData.updated_at).toBe('NOW()')
    })

    it('excludes soft-deleted records from update', async () => {
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([]),
      })
      mockDb.mockReturnValue(chain)

      await repo.update('deleted-rec', { amount: 100 })

      expect(chain.whereNull).toHaveBeenCalledWith('deleted_at')
    })

    it('can update type field', async () => {
      const updatedRow = { ...sampleRow, type: 'expense' as RecordType }
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([updatedRow]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.update('rec-uuid-1', { type: 'expense' })
      expect(result?.type).toBe('expense')
    })
  })

  describe('delete', () => {
    it('sets deleted_at timestamp instead of removing the row', async () => {
      let updatedData: any
      const chain = makeChain({
        update: jest.fn((data) => {
          updatedData = data
          return chain.update
        }),
      })
      // update returns a count (number), not a chain with returning
      chain.update = jest.fn((data) => {
        updatedData = data
        return Promise.resolve(1)
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.delete('rec-uuid-1')

      expect(result).toBe(true)
      expect(updatedData).toMatchObject({ deleted_at: 'NOW()' })
      expect(chain.whereNull).toHaveBeenCalledWith('deleted_at')
    })

    it('returns false when record not found or already soft-deleted', async () => {
      const chain = makeChain()
      chain.update = jest.fn().mockResolvedValue(0)
      mockDb.mockReturnValue(chain)

      const result = await repo.delete('nonexistent')
      expect(result).toBe(false)
    })

    it('only targets non-deleted records (whereNull deleted_at)', async () => {
      const chain = makeChain()
      chain.update = jest.fn().mockResolvedValue(1)
      mockDb.mockReturnValue(chain)

      await repo.delete('rec-uuid-1')

      expect(chain.whereNull).toHaveBeenCalledWith('deleted_at')
    })
  })

  describe('restore', () => {
    it('clears deleted_at and returns the restored record', async () => {
      const deletedRow = { ...sampleRow, deleted_at: new Date('2024-04-01T00:00:00Z') }
      const restoredRow = { ...sampleRow, deleted_at: null }
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([restoredRow]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.restore('rec-uuid-1')

      expect(result).toEqual(sampleRecord)
      expect(chain.whereNotNull).toHaveBeenCalledWith('deleted_at')
    })

    it('returns null when record not found', async () => {
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.restore('nonexistent')
      expect(result).toBeNull()
    })

    it('returns null when record is not soft-deleted (whereNotNull filters it out)', async () => {
      const chain = makeChain({
        returning: jest.fn().mockResolvedValue([]),
      })
      mockDb.mockReturnValue(chain)

      const result = await repo.restore('rec-uuid-1')
      expect(result).toBeNull()
      expect(chain.whereNotNull).toHaveBeenCalledWith('deleted_at')
    })

    it('includes updated_at: NOW() in the restore update payload', async () => {
      let updatedData: any
      const chain = makeChain({
        update: jest.fn((data) => {
          updatedData = data
          return chain
        }),
        returning: jest.fn().mockResolvedValue([sampleRow]),
      })
      mockDb.mockReturnValue(chain)

      await repo.restore('rec-uuid-1')

      expect(updatedData).toMatchObject({ deleted_at: null, updated_at: 'NOW()' })
    })
  })
})
