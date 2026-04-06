import {
  NotFoundError,
  ConflictError,
  ValidationError,
  UnauthenticatedError,
  ForbiddenError,
} from '../../src/errors'
import type { User, FinancialRecord, DashboardSummary, CategorySummary, TrendEntry, ErrorResponse, FieldError, Role, RecordType } from '../../src/types'

describe('Custom Error Classes', () => {
  it('NotFoundError has correct name and message', () => {
    const err = new NotFoundError('User not found')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(NotFoundError)
    expect(err.name).toBe('NotFoundError')
    expect(err.message).toBe('User not found')
  })

  it('NotFoundError uses default message', () => {
    const err = new NotFoundError()
    expect(err.message).toBe('Resource not found')
  })

  it('ConflictError has correct name and message', () => {
    const err = new ConflictError('Email already taken')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ConflictError)
    expect(err.name).toBe('ConflictError')
    expect(err.message).toBe('Email already taken')
  })

  it('ConflictError uses default message', () => {
    const err = new ConflictError()
    expect(err.message).toBe('Resource already exists')
  })

  it('ValidationError carries fieldErrors', () => {
    const fieldErrors: FieldError[] = [
      { field: 'email', message: 'Must be a valid email' },
      { field: 'role', message: 'Invalid role value' },
    ]
    const err = new ValidationError('Validation failed', fieldErrors)
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ValidationError)
    expect(err.name).toBe('ValidationError')
    expect(err.fieldErrors).toEqual(fieldErrors)
  })

  it('ValidationError defaults to empty fieldErrors', () => {
    const err = new ValidationError()
    expect(err.fieldErrors).toEqual([])
  })

  it('UnauthenticatedError has correct name', () => {
    const err = new UnauthenticatedError()
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(UnauthenticatedError)
    expect(err.name).toBe('UnauthenticatedError')
    expect(err.message).toBe('Authentication required')
  })

  it('ForbiddenError has correct name', () => {
    const err = new ForbiddenError()
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ForbiddenError)
    expect(err.name).toBe('ForbiddenError')
    expect(err.message).toBe('Insufficient permissions')
  })

  it('instanceof checks work correctly after subclassing', () => {
    const errors = [
      new NotFoundError(),
      new ConflictError(),
      new ValidationError(),
      new UnauthenticatedError(),
      new ForbiddenError(),
    ]
    errors.forEach((e) => expect(e).toBeInstanceOf(Error))
    expect(errors[0]).toBeInstanceOf(NotFoundError)
    expect(errors[1]).toBeInstanceOf(ConflictError)
    expect(errors[2]).toBeInstanceOf(ValidationError)
    expect(errors[3]).toBeInstanceOf(UnauthenticatedError)
    expect(errors[4]).toBeInstanceOf(ForbiddenError)
  })
})

describe('TypeScript domain types (compile-time checks)', () => {
  it('Role type accepts valid values', () => {
    const roles: Role[] = ['viewer', 'analyst', 'admin']
    expect(roles).toHaveLength(3)
  })

  it('RecordType accepts valid values', () => {
    const types: RecordType[] = ['income', 'expense']
    expect(types).toHaveLength(2)
  })

  it('User interface shape is correct', () => {
    const user: User = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'alice',
      email: 'alice@example.com',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(user.role).toBe('admin')
    expect(user.status).toBe('active')
  })

  it('FinancialRecord interface shape is correct', () => {
    const record: FinancialRecord = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      amount: 1500.00,
      type: 'income',
      category: 'Salary',
      date: '2024-01-15',
      createdBy: '123e4567-e89b-12d3-a456-426614174000',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(record.type).toBe('income')
    expect(record.notes).toBeUndefined()
    expect(record.deletedAt).toBeUndefined()
  })

  it('DashboardSummary netBalance equals totalIncome minus totalExpenses', () => {
    const summary: DashboardSummary = {
      totalIncome: 5000,
      totalExpenses: 3000,
      netBalance: 2000,
    }
    expect(summary.netBalance).toBe(summary.totalIncome - summary.totalExpenses)
  })

  it('CategorySummary shape is correct', () => {
    const cat: CategorySummary = { category: 'Rent', income: 0, expenses: 1200 }
    expect(cat.category).toBe('Rent')
  })

  it('TrendEntry shape is correct', () => {
    const entry: TrendEntry = { period: '2024-01', income: 3000, expenses: 1500 }
    expect(entry.period).toBe('2024-01')
  })

  it('ErrorResponse with optional errors array', () => {
    const errResp: ErrorResponse = {
      error: 'Validation failed',
      errors: [{ field: 'email', message: 'Invalid email' }],
    }
    expect(errResp.errors).toHaveLength(1)

    const simpleErr: ErrorResponse = { error: 'Not found' }
    expect(simpleErr.errors).toBeUndefined()
  })
})
