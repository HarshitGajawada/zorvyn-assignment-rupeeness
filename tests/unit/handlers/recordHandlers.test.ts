import { Request, Response, NextFunction } from 'express'
import { NotFoundError } from '../../../src/errors'
import { FinancialRecord } from '../../../src/types'

jest.mock('../../../src/services/RecordService', () => ({
  __esModule: true,
  default: {
    createRecord: jest.fn(),
    listRecords: jest.fn(),
    getRecordById: jest.fn(),
    updateRecord: jest.fn(),
    deleteRecord: jest.fn(),
    restoreRecord: jest.fn(),
  },
}))

import recordService from '../../../src/services/RecordService'
import * as handlers from '../../../src/handlers/recordHandlers'

const mockRecordService = recordService as jest.Mocked<typeof recordService>

const mockRecord: FinancialRecord = {
  id: 'rec-123',
  amount: 100,
  type: 'income',
  category: 'Salary',
  date: '2024-01-15',
  createdBy: 'user-456',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

function makeRes(): jest.Mocked<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>
}

function makeNext(): jest.MockedFunction<NextFunction> {
  return jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('createRecord', () => {
  it('returns 201 with the created record', async () => {
    mockRecordService.createRecord.mockResolvedValue(mockRecord)
    const req = {
      body: { amount: 100, type: 'income', category: 'Salary', date: '2024-01-15' },
      user: { id: 'user-456', role: 'admin' as const },
    } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.createRecord(req, res, next)

    expect(mockRecordService.createRecord).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'user-456' })
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(mockRecord)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when service throws', async () => {
    const err = new Error('DB error')
    mockRecordService.createRecord.mockRejectedValue(err)
    const req = {
      body: { amount: 100, type: 'income', category: 'Salary', date: '2024-01-15' },
      user: { id: 'user-456', role: 'admin' as const },
    } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.createRecord(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('listRecords', () => {
  it('returns 200 with paginated response object', async () => {
    const paginated = { records: [mockRecord], total: 1, totalPages: 1 }
    mockRecordService.listRecords.mockResolvedValue(paginated)
    const req = { query: {} } as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.listRecords(req, res, next)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(paginated)
    expect(next).not.toHaveBeenCalled()
  })

  it('passes query filters to service', async () => {
    const paginated = { records: [], total: 0, totalPages: 1 }
    mockRecordService.listRecords.mockResolvedValue(paginated)
    const req = { query: { type: 'income', category: 'Salary' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.listRecords(req, res, next)

    expect(mockRecordService.listRecords).toHaveBeenCalledWith({ type: 'income', category: 'Salary' })
  })

  it('calls next(err) when service throws', async () => {
    const err = new Error('DB error')
    mockRecordService.listRecords.mockRejectedValue(err)
    const req = { query: {} } as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.listRecords(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
  })
})

describe('getRecordById', () => {
  it('returns 200 with the record', async () => {
    mockRecordService.getRecordById.mockResolvedValue(mockRecord)
    const req = { params: { id: 'rec-123' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getRecordById(req, res, next)

    expect(mockRecordService.getRecordById).toHaveBeenCalledWith('rec-123')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(mockRecord)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) with NotFoundError when record does not exist', async () => {
    const err = new NotFoundError('Record with id missing not found')
    mockRecordService.getRecordById.mockRejectedValue(err)
    const req = { params: { id: 'missing' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getRecordById(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
  })
})

describe('updateRecord', () => {
  it('returns 200 with the updated record', async () => {
    const updated = { ...mockRecord, amount: 200 }
    mockRecordService.updateRecord.mockResolvedValue(updated)
    const req = { params: { id: 'rec-123' }, body: { amount: 200 } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.updateRecord(req, res, next)

    expect(mockRecordService.updateRecord).toHaveBeenCalledWith('rec-123', { amount: 200 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(updated)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when service throws', async () => {
    const err = new NotFoundError('Record with id missing not found')
    mockRecordService.updateRecord.mockRejectedValue(err)
    const req = { params: { id: 'missing' }, body: { amount: 200 } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.updateRecord(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
  })
})

describe('deleteRecord', () => {
  it('returns 204 with no body', async () => {
    mockRecordService.deleteRecord.mockResolvedValue(undefined)
    const req = { params: { id: 'rec-123' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.deleteRecord(req, res, next)

    expect(mockRecordService.deleteRecord).toHaveBeenCalledWith('rec-123')
    expect(res.status).toHaveBeenCalledWith(204)
    expect(res.send).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) with NotFoundError when record does not exist', async () => {
    const err = new NotFoundError('Record with id missing not found')
    mockRecordService.deleteRecord.mockRejectedValue(err)
    const req = { params: { id: 'missing' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.deleteRecord(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
  })
})

describe('restoreRecord', () => {
  it('returns 200 with the restored record', async () => {
    mockRecordService.restoreRecord.mockResolvedValue(mockRecord)
    const req = { params: { id: 'rec-123' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.restoreRecord(req, res, next)

    expect(mockRecordService.restoreRecord).toHaveBeenCalledWith('rec-123')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(mockRecord)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) with NotFoundError when record not found or not soft-deleted', async () => {
    const err = new NotFoundError('Record with id missing not found')
    mockRecordService.restoreRecord.mockRejectedValue(err)
    const req = { params: { id: 'missing' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.restoreRecord(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
  })
})
