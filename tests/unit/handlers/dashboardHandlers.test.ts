import { Request, Response, NextFunction } from 'express'
import { DashboardSummary, CategorySummary, TrendEntry, FinancialRecord } from '../../../src/types'

jest.mock('../../../src/services/DashboardService', () => ({
  __esModule: true,
  default: {
    getSummary: jest.fn(),
    getCategorySummary: jest.fn(),
    getRecentActivity: jest.fn(),
    getMonthlyTrends: jest.fn(),
    getWeeklyTrends: jest.fn(),
  },
}))

import dashboardService from '../../../src/services/DashboardService'
import * as handlers from '../../../src/handlers/dashboardHandlers'

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>

function makeRes(): jest.Mocked<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>
}

function makeNext(): jest.MockedFunction<NextFunction> {
  return jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()
})

const mockSummary: DashboardSummary = {
  totalIncome: 5000,
  totalExpenses: 2000,
  netBalance: 3000,
}

const mockCategories: CategorySummary[] = [
  { category: 'Salary', income: 5000, expenses: 0 },
  { category: 'Rent', income: 0, expenses: 2000 },
]

const mockRecord: FinancialRecord = {
  id: 'rec-1',
  amount: 100,
  type: 'income',
  category: 'Salary',
  date: '2024-01-15',
  createdBy: 'user-1',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

const mockTrends: TrendEntry[] = [
  { period: '2024-01', income: 5000, expenses: 2000 },
  { period: '2024-02', income: 4500, expenses: 1800 },
]

describe('getSummary', () => {
  it('returns 200 with summary data', async () => {
    mockDashboardService.getSummary.mockResolvedValue(mockSummary)
    const req = { query: {} } as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getSummary(req, res, next)

    expect(mockDashboardService.getSummary).toHaveBeenCalledWith({ start_date: undefined, end_date: undefined })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(mockSummary)
    expect(next).not.toHaveBeenCalled()
  })

  it('passes start_date and end_date filters to service', async () => {
    mockDashboardService.getSummary.mockResolvedValue(mockSummary)
    const req = { query: { start_date: '2024-01-01', end_date: '2024-01-31' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getSummary(req, res, next)

    expect(mockDashboardService.getSummary).toHaveBeenCalledWith({
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })
  })

  it('calls next(err) when service throws', async () => {
    const err = new Error('DB error')
    mockDashboardService.getSummary.mockRejectedValue(err)
    const req = { query: {} } as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getSummary(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('getCategorySummary', () => {
  it('returns 200 with category data', async () => {
    mockDashboardService.getCategorySummary.mockResolvedValue(mockCategories)
    const req = {} as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getCategorySummary(req, res, next)

    expect(mockDashboardService.getCategorySummary).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(mockCategories)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when service throws', async () => {
    const err = new Error('DB error')
    mockDashboardService.getCategorySummary.mockRejectedValue(err)
    const req = {} as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getCategorySummary(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('getRecentActivity', () => {
  it('returns 200 with recent records', async () => {
    mockDashboardService.getRecentActivity.mockResolvedValue([mockRecord])
    const req = {} as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getRecentActivity(req, res, next)

    expect(mockDashboardService.getRecentActivity).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([mockRecord])
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when service throws', async () => {
    const err = new Error('DB error')
    mockDashboardService.getRecentActivity.mockRejectedValue(err)
    const req = {} as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getRecentActivity(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('getMonthlyTrends', () => {
  it('returns 200 with monthly trend data', async () => {
    mockDashboardService.getMonthlyTrends.mockResolvedValue(mockTrends)
    const req = {} as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getMonthlyTrends(req, res, next)

    expect(mockDashboardService.getMonthlyTrends).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(mockTrends)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when service throws', async () => {
    const err = new Error('DB error')
    mockDashboardService.getMonthlyTrends.mockRejectedValue(err)
    const req = {} as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getMonthlyTrends(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('getWeeklyTrends', () => {
  it('returns 200 with weekly trend data', async () => {
    mockDashboardService.getWeeklyTrends.mockResolvedValue(mockTrends)
    const req = {} as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getWeeklyTrends(req, res, next)

    expect(mockDashboardService.getWeeklyTrends).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(mockTrends)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when service throws', async () => {
    const err = new Error('DB error')
    mockDashboardService.getWeeklyTrends.mockRejectedValue(err)
    const req = {} as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getWeeklyTrends(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})
