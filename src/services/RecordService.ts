import { RecordRepository, RecordFilters, PaginatedRecords } from '../repositories/RecordRepository'
import recordRepository from '../repositories/RecordRepository'
import { NotFoundError } from '../errors'
import { FinancialRecord, RecordType } from '../types'

export class RecordService {
  constructor(private repo: RecordRepository) {}

  async createRecord(data: {
    amount: number
    type: RecordType
    category: string
    date: string
    notes?: string
    createdBy: string
  }): Promise<FinancialRecord> {
    return this.repo.create(data)
  }

  async listRecords(filters?: RecordFilters): Promise<PaginatedRecords> {
    return this.repo.findAll(filters)
  }

  async getRecordById(id: string): Promise<FinancialRecord> {
    const record = await this.repo.findById(id)
    if (!record) throw new NotFoundError(`Record with id ${id} not found`)
    return record
  }

  async updateRecord(
    id: string,
    data: Partial<{
      amount: number
      type: RecordType
      category: string
      date: string
      notes: string
    }>
  ): Promise<FinancialRecord> {
    const record = await this.repo.update(id, data)
    if (!record) throw new NotFoundError(`Record with id ${id} not found`)
    return record
  }

  async deleteRecord(id: string): Promise<void> {
    const deleted = await this.repo.delete(id)
    if (!deleted) throw new NotFoundError(`Record with id ${id} not found`)
  }

  async restoreRecord(id: string): Promise<FinancialRecord> {
    const record = await this.repo.restore(id)
    if (!record) throw new NotFoundError(`Record with id ${id} not found`)
    return record
  }
}

export default new RecordService(recordRepository)
