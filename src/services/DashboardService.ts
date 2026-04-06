import db from '../db'
import { DashboardSummary, CategorySummary, TrendEntry, FinancialRecord } from '../types'

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

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function getTrailing12Months(now: Date): string[] {
  const months: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`)
  }
  return months
}

function getTrailing8ISOWeeks(now: Date): string[] {
  const weeks: string[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const year = getISOWeekYear(d)
    const week = getISOWeek(d)
    weeks.push(`${year}-W${pad2(week)}`)
  }
  return weeks
}

function mapRowToFinancialRecord(row: Record<string, unknown>): FinancialRecord {
  return {
    id: row.id as string,
    amount: Number(row.amount),
    type: row.type as FinancialRecord['type'],
    category: row.category as string,
    date: row.date instanceof Date
      ? row.date.toISOString().slice(0, 10)
      : String(row.date).slice(0, 10),
    notes: row.notes as string | undefined,
    createdBy: row.created_by as string,
    deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class DashboardService {
  async getSummary(filters?: { start_date?: string; end_date?: string }): Promise<DashboardSummary> {
    let query = db('financial_records').whereNull('deleted_at')

    if (filters?.start_date) {
      query = query.where('date', '>=', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.where('date', '<=', filters.end_date)
    }

    const rows = await query.select(
      db.raw(`SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income`),
      db.raw(`SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses`)
    )

    const totalIncome = Number(rows[0]?.total_income ?? 0)
    const totalExpenses = Number(rows[0]?.total_expenses ?? 0)

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
    }
  }

  async getCategorySummary(): Promise<CategorySummary[]> {
    const rows = await db('financial_records')
      .whereNull('deleted_at')
      .select(
        'category',
        db.raw(`SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income`),
        db.raw(`SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses`)
      )
      .groupBy('category')

    return rows.map((row) => ({
      category: row.category as string,
      income: Number(row.income ?? 0),
      expenses: Number(row.expenses ?? 0),
    }))
  }

  async getRecentActivity(): Promise<FinancialRecord[]> {
    const rows = await db('financial_records')
      .whereNull('deleted_at')
      .orderBy('updated_at', 'desc')
      .limit(10)
      .select('*')

    return rows.map(mapRowToFinancialRecord)
  }

  async getMonthlyTrends(): Promise<TrendEntry[]> {
    const now = new Date()
    const periods = getTrailing12Months(now)

    // Earliest month start
    const earliest = periods[0] + '-01'

    const rows = await db('financial_records')
      .whereNull('deleted_at')
      .where('date', '>=', earliest)
      .select(
        db.raw(`to_char(date, 'YYYY-MM') as period`),
        db.raw(`SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income`),
        db.raw(`SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses`)
      )
      .groupByRaw(`to_char(date, 'YYYY-MM')`)

    const dataMap = new Map<string, { income: number; expenses: number }>()
    for (const row of rows) {
      dataMap.set(row.period as string, {
        income: Number(row.income ?? 0),
        expenses: Number(row.expenses ?? 0),
      })
    }

    return periods.map((period) => ({
      period,
      income: dataMap.get(period)?.income ?? 0,
      expenses: dataMap.get(period)?.expenses ?? 0,
    }))
  }

  async getWeeklyTrends(): Promise<TrendEntry[]> {
    const now = new Date()
    const periods = getTrailing8ISOWeeks(now)

    // Earliest week Monday
    const firstPeriod = periods[0]
    const [yearStr, weekStr] = firstPeriod.split('-W')
    const year = parseInt(yearStr, 10)
    const week = parseInt(weekStr, 10)
    // ISO week 1 Monday: Jan 4 is always in week 1
    const jan4 = new Date(year, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const week1Monday = new Date(jan4)
    week1Monday.setDate(jan4.getDate() - (jan4Day - 1))
    const earliestDate = new Date(week1Monday)
    earliestDate.setDate(week1Monday.getDate() + (week - 1) * 7)
    const earliestStr = earliestDate.toISOString().slice(0, 10)

    const rows = await db('financial_records')
      .whereNull('deleted_at')
      .where('date', '>=', earliestStr)
      .select(
        db.raw(`to_char(date, 'IYYY') || '-W' || lpad(to_char(date, 'IW'), 2, '0') as period`),
        db.raw(`SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income`),
        db.raw(`SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses`)
      )
      .groupByRaw(`to_char(date, 'IYYY') || '-W' || lpad(to_char(date, 'IW'), 2, '0')`)

    const dataMap = new Map<string, { income: number; expenses: number }>()
    for (const row of rows) {
      dataMap.set(row.period as string, {
        income: Number(row.income ?? 0),
        expenses: Number(row.expenses ?? 0),
      })
    }

    return periods.map((period) => ({
      period,
      income: dataMap.get(period)?.income ?? 0,
      expenses: dataMap.get(period)?.expenses ?? 0,
    }))
  }
}

export default new DashboardService()
