import db from '../db'
import { FinancialRecord, RecordType } from '../types'

interface RecordRow {
  id: string
  amount: string | number
  type: RecordType
  category: string
  date: string
  notes: string | null
  created_by: string
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface RecordFilters {
  start_date?: string  // YYYY-MM-DD, inclusive
  end_date?: string    // YYYY-MM-DD, inclusive
  category?: string    // case-insensitive match
  type?: 'income' | 'expense'
  page?: number        // positive integer
  limit?: number       // positive integer
  search?: string      // case-insensitive match on notes or category
}

export interface PaginatedRecords {
  records: FinancialRecord[]
  total: number
  totalPages: number
}

function rowToRecord(row: RecordRow): FinancialRecord {
  return {
    id: row.id,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    date: typeof row.date === 'string' ? row.date.substring(0, 10) : row.date,
    notes: row.notes ?? undefined,
    createdBy: row.created_by,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class RecordRepository {
  async create(data: {
    amount: number
    type: RecordType
    category: string
    date: string
    notes?: string
    createdBy: string
  }): Promise<FinancialRecord> {
    const [row] = await db('financial_records')
      .insert({
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: data.date,
        notes: data.notes ?? null,
        created_by: data.createdBy,
      })
      .returning('*')
    return rowToRecord(row as RecordRow)
  }

  async findAll(filters?: RecordFilters): Promise<PaginatedRecords> {
    let query = db('financial_records')
      .whereNull('deleted_at')
      .orderBy('date', 'desc')

    if (filters?.start_date) {
      query = query.where('date', '>=', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.where('date', '<=', filters.end_date)
    }
    if (filters?.category) {
      query = query.whereRaw('LOWER(category) = LOWER(?)', [filters.category])
    }
    if (filters?.type) {
      query = query.where('type', filters.type)
    }
    if (filters?.search) {
      query = query.whereRaw('LOWER(category) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?)',
        [`%${filters.search}%`, `%${filters.search}%`])
    }

    const { page, limit } = filters ?? {}

    if (page !== undefined && limit !== undefined) {
      const countResult = await db('financial_records')
        .whereNull('deleted_at')
        .modify((q) => {
          if (filters?.start_date) q.where('date', '>=', filters.start_date!)
          if (filters?.end_date) q.where('date', '<=', filters.end_date!)
          if (filters?.category) q.whereRaw('LOWER(category) = LOWER(?)', [filters.category])
          if (filters?.type) q.where('type', filters.type)
          if (filters?.search) q.whereRaw('LOWER(category) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?)', [`%${filters.search}%`, `%${filters.search}%`])
        })
        .count('* as count')
        .first()

      const total = Number((countResult as any)?.count ?? 0)
      const totalPages = Math.ceil(total / limit)
      const offset = (page - 1) * limit
      const rows = await query.limit(limit).offset(offset).select('*')
      return { records: (rows as RecordRow[]).map(rowToRecord), total, totalPages }
    }

    const rows = await query.select('*')
    const records = (rows as RecordRow[]).map(rowToRecord)
    return { records, total: records.length, totalPages: 1 }
  }

  async findById(id: string): Promise<FinancialRecord | null> {
    const row = await db('financial_records')
      .whereNull('deleted_at')
      .where({ id })
      .first()
    if (!row) return null
    return rowToRecord(row as RecordRow)
  }

  async update(
    id: string,
    data: Partial<{
      amount: number
      type: RecordType
      category: string
      date: string
      notes: string
    }>
  ): Promise<FinancialRecord | null> {
    const [row] = await db('financial_records')
      .whereNull('deleted_at')
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*')
    if (!row) return null
    return rowToRecord(row as RecordRow)
  }

  async delete(id: string): Promise<boolean> {
    const count = await db('financial_records')
      .where({ id })
      .whereNull('deleted_at')
      .update({ deleted_at: db.fn.now() })
    return count > 0
  }

  async restore(id: string): Promise<FinancialRecord | null> {
    const [row] = await db('financial_records')
      .where({ id })
      .whereNotNull('deleted_at')
      .update({ deleted_at: null, updated_at: db.fn.now() })
      .returning('*')
    if (!row) return null
    return rowToRecord(row as RecordRow)
  }
}

export default new RecordRepository()
