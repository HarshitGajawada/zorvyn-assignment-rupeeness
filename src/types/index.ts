export type Role = 'viewer' | 'analyst' | 'admin'
export type RecordType = 'income' | 'expense'

export interface User {
  id: string
  username: string
  email: string
  role: Role
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface FinancialRecord {
  id: string
  amount: number        // always positive
  type: RecordType
  category: string
  date: string          // ISO 8601 date
  notes?: string
  createdBy: string     // User.id
  deletedAt?: Date      // null = not deleted
  createdAt: Date
  updatedAt: Date
}

export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  netBalance: number    // totalIncome - totalExpenses
}

export interface CategorySummary {
  category: string
  income: number
  expenses: number
}

export interface TrendEntry {
  period: string        // "2024-01" for monthly, "2024-W03" for weekly
  income: number
  expenses: number
}

export interface ErrorResponse {
  error: string           // human-readable summary
  errors?: FieldError[]   // field-level details (validation failures)
}

export interface FieldError {
  field: string
  message: string
}
