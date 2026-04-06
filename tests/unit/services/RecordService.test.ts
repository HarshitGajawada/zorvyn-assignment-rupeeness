import { RecordService } from '../../../src/services/RecordService'
import { RecordRepository, RecordFilters, PaginatedRecords } from '../../../src/repositories/RecordRepository'
import { NotFoundError } from '../../../src/errors'
import { FinancialRecord, RecordType } from '../../../src/types'

const mockRecord: FinancialRecord = {
  id: 'rec-123',
  amount: 100,
  type: 'income',
  category: 'Salary',
  date: '2024-01-15',
  notes: 'Monthly salary',
  createdBy: 'user-abc',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

function makeMockRepo(): jest.Mocked<RecordRepository> {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  } as unknown as jest.Mocked<RecordRepository>
}

describe('RecordService', () => {
  let repo: jest.Mocked<RecordRepository>
  let service: RecordService

  beforeEach(() => {
    repo = makeMockRepo()
    service = new RecordService(repo)
  })

  describe('createRecord', () => {
    it('delegates to repo.create and returns the result', async () => {
      repo.create.mockResolvedValue(mockRecord)
      const data = {
        amount: 100,
        type: 'income' as RecordType,
        category: 'Salary',
        date: '2024-01-15',
        notes: 'Monthly salary',
        createdBy: 'user-abc',
      }
      const result = await service.createRecord(data)
      expect(repo.create).toHaveBeenCalledWith(data)
      expect(result).toBe(mockRecord)
    })
  })

  describe('listRecords', () => {
    it('delegates to repo.findAll with no filters and returns the result', async () => {
      const paginated: PaginatedRecords = { records: [mockRecord], total: 1, totalPages: 1 }
      repo.findAll.mockResolvedValue(paginated)
      const result = await service.listRecords()
      expect(repo.findAll).toHaveBeenCalledWith(undefined)
      expect(result).toEqual(paginated)
    })

    it('passes filters to repo.findAll', async () => {
      const paginated: PaginatedRecords = { records: [mockRecord], total: 1, totalPages: 1 }
      repo.findAll.mockResolvedValue(paginated)
      const filters: RecordFilters = { type: 'income', category: 'Salary' }
      const result = await service.listRecords(filters)
      expect(repo.findAll).toHaveBeenCalledWith(filters)
      expect(result).toEqual(paginated)
    })

    it('passes pagination params to repo.findAll', async () => {
      const paginated: PaginatedRecords = { records: [mockRecord], total: 25, totalPages: 3 }
      repo.findAll.mockResolvedValue(paginated)
      const filters: RecordFilters = { page: 1, limit: 10 }
      const result = await service.listRecords(filters)
      expect(repo.findAll).toHaveBeenCalledWith(filters)
      expect(result.total).toBe(25)
      expect(result.totalPages).toBe(3)
    })
  })

  describe('getRecordById', () => {
    it('returns the record when repo finds it', async () => {
      repo.findById.mockResolvedValue(mockRecord)
      const result = await service.getRecordById('rec-123')
      expect(repo.findById).toHaveBeenCalledWith('rec-123')
      expect(result).toBe(mockRecord)
    })

    it('throws NotFoundError when repo returns null', async () => {
      repo.findById.mockResolvedValue(null)
      await expect(service.getRecordById('missing-id')).rejects.toThrow(NotFoundError)
      await expect(service.getRecordById('missing-id')).rejects.toThrow('Record with id missing-id not found')
    })
  })

  describe('updateRecord', () => {
    it('returns the updated record when repo finds it', async () => {
      const updated = { ...mockRecord, amount: 200 }
      repo.update.mockResolvedValue(updated)
      const result = await service.updateRecord('rec-123', { amount: 200 })
      expect(repo.update).toHaveBeenCalledWith('rec-123', { amount: 200 })
      expect(result).toBe(updated)
    })

    it('throws NotFoundError when repo returns null', async () => {
      repo.update.mockResolvedValue(null)
      await expect(service.updateRecord('missing-id', { amount: 200 })).rejects.toThrow(NotFoundError)
      await expect(service.updateRecord('missing-id', { amount: 200 })).rejects.toThrow('Record with id missing-id not found')
    })
  })

  describe('deleteRecord', () => {
    it('resolves without error when repo returns true', async () => {
      repo.delete.mockResolvedValue(true)
      await expect(service.deleteRecord('rec-123')).resolves.toBeUndefined()
      expect(repo.delete).toHaveBeenCalledWith('rec-123')
    })

    it('throws NotFoundError when repo returns false', async () => {
      repo.delete.mockResolvedValue(false)
      await expect(service.deleteRecord('missing-id')).rejects.toThrow(NotFoundError)
      await expect(service.deleteRecord('missing-id')).rejects.toThrow('Record with id missing-id not found')
    })
  })

  describe('restoreRecord', () => {
    it('returns the restored record when repo finds it', async () => {
      repo.restore.mockResolvedValue(mockRecord)
      const result = await service.restoreRecord('rec-123')
      expect(repo.restore).toHaveBeenCalledWith('rec-123')
      expect(result).toBe(mockRecord)
    })

    it('throws NotFoundError when repo returns null', async () => {
      repo.restore.mockResolvedValue(null)
      await expect(service.restoreRecord('missing-id')).rejects.toThrow(NotFoundError)
      await expect(service.restoreRecord('missing-id')).rejects.toThrow('Record with id missing-id not found')
    })
  })
})
