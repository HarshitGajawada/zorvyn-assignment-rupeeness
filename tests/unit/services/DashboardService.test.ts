import { DashboardService } from '../../../src/services/DashboardService'

// Mock the db module
jest.mock('../../../src/db', () => {
  const mockQueryBuilder = {
    whereNull: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    groupByRaw: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  }

  const mockDb = jest.fn(() => mockQueryBuilder) as jest.Mock & {
    raw: jest.Mock
    _mockQueryBuilder: typeof mockQueryBuilder
  }
  mockDb.raw = jest.fn((sql: string) => ({ sql }))
  mockDb._mockQueryBuilder = mockQueryBuilder

  return { __esModule: true, default: mockDb }
})

import db from '../../../src/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as unknown as jest.Mock & { raw: jest.Mock; _mockQueryBuilder: Record<string, jest.Mock> }

function getQueryBuilder() {
  return mockDb._mockQueryBuilder
}

describe('DashboardService', () => {
  let service: DashboardService

  beforeEach(() => {
    jest.clearAllMocks()
    // Re-wire mockReturnThis for chained calls
    const qb = getQueryBuilder()
    qb.whereNull.mockReturnThis()
    qb.where.mockReturnThis()
    qb.select.mockReturnThis()
    qb.groupBy.mockReturnThis()
    qb.groupByRaw.mockReturnThis()
    qb.orderBy.mockReturnThis()
    qb.limit.mockReturnThis()
    service = new DashboardService()
  })

  describe('getSummary', () => {
    it('returns correct totalIncome, totalExpenses, and netBalance', async () => {
      const qb = getQueryBuilder()
      qb.select.mockResolvedValue([{ total_income: '1500.00', total_expenses: '500.00' }])

      const result = await service.getSummary()

      expect(result.totalIncome).toBe(1500)
      expect(result.totalExpenses).toBe(500)
      expect(result.netBalance).toBe(1000)
    })

    it('returns zeros when no records exist', async () => {
      const qb = getQueryBuilder()
      qb.select.mockResolvedValue([{ total_income: null, total_expenses: null }])

      const result = await service.getSummary()

      expect(result.totalIncome).toBe(0)
      expect(result.totalExpenses).toBe(0)
      expect(result.netBalance).toBe(0)
    })

    it('applies start_date filter when provided', async () => {
      const qb = getQueryBuilder()
      qb.select.mockResolvedValue([{ total_income: '200', total_expenses: '100' }])

      await service.getSummary({ start_date: '2024-01-01' })

      expect(qb.where).toHaveBeenCalledWith('date', '>=', '2024-01-01')
    })

    it('applies end_date filter when provided', async () => {
      const qb = getQueryBuilder()
      qb.select.mockResolvedValue([{ total_income: '200', total_expenses: '100' }])

      await service.getSummary({ end_date: '2024-12-31' })

      expect(qb.where).toHaveBeenCalledWith('date', '<=', '2024-12-31')
    })

    it('applies both start_date and end_date filters when provided', async () => {
      const qb = getQueryBuilder()
      qb.select.mockResolvedValue([{ total_income: '300', total_expenses: '150' }])

      await service.getSummary({ start_date: '2024-01-01', end_date: '2024-06-30' })

      expect(qb.where).toHaveBeenCalledWith('date', '>=', '2024-01-01')
      expect(qb.where).toHaveBeenCalledWith('date', '<=', '2024-06-30')
    })

    it('computes netBalance as totalIncome minus totalExpenses', async () => {
      const qb = getQueryBuilder()
      qb.select.mockResolvedValue([{ total_income: '800', total_expenses: '1200' }])

      const result = await service.getSummary()

      expect(result.netBalance).toBe(-400)
    })
  })

  describe('getCategorySummary', () => {
    it('returns grouped category data with income and expenses', async () => {
      const qb = getQueryBuilder()
      qb.groupBy.mockResolvedValue([
        { category: 'Salary', income: '3000', expenses: '0' },
        { category: 'Rent', income: '0', expenses: '1200' },
        { category: 'Food', income: '0', expenses: '400' },
      ])

      const result = await service.getCategorySummary()

      expect(result).toHaveLength(3)
      expect(result).toContainEqual({ category: 'Salary', income: 3000, expenses: 0 })
      expect(result).toContainEqual({ category: 'Rent', income: 0, expenses: 1200 })
      expect(result).toContainEqual({ category: 'Food', income: 0, expenses: 400 })
    })

    it('returns empty array when no records exist', async () => {
      const qb = getQueryBuilder()
      qb.groupBy.mockResolvedValue([])

      const result = await service.getCategorySummary()

      expect(result).toEqual([])
    })

    it('filters deleted records (whereNull deleted_at)', async () => {
      const qb = getQueryBuilder()
      qb.groupBy.mockResolvedValue([])

      await service.getCategorySummary()

      expect(qb.whereNull).toHaveBeenCalledWith('deleted_at')
    })
  })

  describe('getRecentActivity', () => {
    const makeRow = (id: string, updatedAt: string) => ({
      id,
      amount: '100',
      type: 'income',
      category: 'Test',
      date: new Date('2024-01-15'),
      notes: null,
      created_by: 'user-1',
      deleted_at: null,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: updatedAt,
    })

    it('returns at most 10 records', async () => {
      const qb = getQueryBuilder()
      const rows = Array.from({ length: 10 }, (_, i) =>
        makeRow(`rec-${i}`, `2024-01-${String(10 + i).padStart(2, '0')}T00:00:00Z`)
      )
      qb.select.mockResolvedValue(rows)

      const result = await service.getRecentActivity()

      expect(result).toHaveLength(10)
      expect(qb.limit).toHaveBeenCalledWith(10)
    })

    it('orders by updated_at DESC', async () => {
      const qb = getQueryBuilder()
      qb.select.mockResolvedValue([])

      await service.getRecentActivity()

      expect(qb.orderBy).toHaveBeenCalledWith('updated_at', 'desc')
    })

    it('maps rows to FinancialRecord with camelCase fields', async () => {
      const qb = getQueryBuilder()
      qb.select.mockResolvedValue([makeRow('rec-1', '2024-03-10T12:00:00Z')])

      const result = await service.getRecentActivity()

      expect(result[0]).toMatchObject({
        id: 'rec-1',
        amount: 100,
        type: 'income',
        category: 'Test',
        createdBy: 'user-1',
      })
      expect(result[0].createdAt).toBeInstanceOf(Date)
      expect(result[0].updatedAt).toBeInstanceOf(Date)
    })

    it('filters deleted records (whereNull deleted_at)', async () => {
      const qb = getQueryBuilder()
      qb.select.mockResolvedValue([])

      await service.getRecentActivity()

      expect(qb.whereNull).toHaveBeenCalledWith('deleted_at')
    })
  })

  describe('getMonthlyTrends', () => {
    it('returns exactly 12 entries', async () => {
      const qb = getQueryBuilder()
      qb.groupByRaw.mockResolvedValue([])

      const result = await service.getMonthlyTrends()

      expect(result).toHaveLength(12)
    })

    it('fills missing months with zeros', async () => {
      const qb = getQueryBuilder()
      qb.groupByRaw.mockResolvedValue([])

      const result = await service.getMonthlyTrends()

      for (const entry of result) {
        expect(entry.income).toBe(0)
        expect(entry.expenses).toBe(0)
      }
    })

    it('merges DB data into the correct period slot', async () => {
      const qb = getQueryBuilder()
      // Simulate current month having data
      const now = new Date()
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      qb.groupByRaw.mockResolvedValue([
        { period: currentPeriod, income: '500', expenses: '200' },
      ])

      const result = await service.getMonthlyTrends()

      expect(result).toHaveLength(12)
      const entry = result.find((e) => e.period === currentPeriod)
      expect(entry).toBeDefined()
      expect(entry!.income).toBe(500)
      expect(entry!.expenses).toBe(200)
    })

    it('periods are in YYYY-MM format', async () => {
      const qb = getQueryBuilder()
      qb.groupByRaw.mockResolvedValue([])

      const result = await service.getMonthlyTrends()

      for (const entry of result) {
        expect(entry.period).toMatch(/^\d{4}-\d{2}$/)
      }
    })

    it('covers trailing 12 months ending with current month', async () => {
      const qb = getQueryBuilder()
      qb.groupByRaw.mockResolvedValue([])

      const result = await service.getMonthlyTrends()
      const now = new Date()
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      expect(result[11].period).toBe(currentPeriod)
    })
  })

  describe('getWeeklyTrends', () => {
    it('returns exactly 8 entries', async () => {
      const qb = getQueryBuilder()
      qb.groupByRaw.mockResolvedValue([])

      const result = await service.getWeeklyTrends()

      expect(result).toHaveLength(8)
    })

    it('fills missing weeks with zeros', async () => {
      const qb = getQueryBuilder()
      qb.groupByRaw.mockResolvedValue([])

      const result = await service.getWeeklyTrends()

      for (const entry of result) {
        expect(entry.income).toBe(0)
        expect(entry.expenses).toBe(0)
      }
    })

    it('periods are in YYYY-WNN format', async () => {
      const qb = getQueryBuilder()
      qb.groupByRaw.mockResolvedValue([])

      const result = await service.getWeeklyTrends()

      for (const entry of result) {
        expect(entry.period).toMatch(/^\d{4}-W\d{2}$/)
      }
    })

    it('merges DB data into the correct week slot', async () => {
      const qb = getQueryBuilder()
      // Use current week
      const now = new Date()
      const isoYear = getISOWeekYear(now)
      const isoWeek = getISOWeek(now)
      const currentPeriod = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`

      qb.groupByRaw.mockResolvedValue([
        { period: currentPeriod, income: '750', expenses: '300' },
      ])

      const result = await service.getWeeklyTrends()

      expect(result).toHaveLength(8)
      const entry = result.find((e) => e.period === currentPeriod)
      expect(entry).toBeDefined()
      expect(entry!.income).toBe(750)
      expect(entry!.expenses).toBe(300)
    })

    it('covers trailing 8 weeks ending with current week', async () => {
      const qb = getQueryBuilder()
      qb.groupByRaw.mockResolvedValue([])

      const result = await service.getWeeklyTrends()
      const now = new Date()
      const isoYear = getISOWeekYear(now)
      const isoWeek = getISOWeek(now)
      const currentPeriod = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`

      expect(result[7].period).toBe(currentPeriod)
    })
  })
})

// Helper functions mirrored from DashboardService for test assertions
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  return d.getUTCFullYear()
}
