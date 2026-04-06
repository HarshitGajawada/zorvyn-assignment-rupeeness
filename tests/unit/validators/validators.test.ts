import {
  CreateUserSchema,
  UpdateUserSchema,
  CreateRecordSchema,
  UpdateRecordSchema,
  RecordFilterSchema,
  parseSchema,
} from '../../../src/validators'
import { ValidationError } from '../../../src/errors'

// ── CreateUserSchema ──────────────────────────────────────────────────────────

describe('CreateUserSchema', () => {
  const valid = { username: 'alice', email: 'alice@example.com', role: 'admin' as const }

  it('accepts a valid payload', () => {
    expect(() => parseSchema(CreateUserSchema, valid)).not.toThrow()
  })

  it('strips unknown fields', () => {
    const result = parseSchema(CreateUserSchema, { ...valid, extra: 'ignored' })
    expect(result).not.toHaveProperty('extra')
  })

  it('rejects missing username', () => {
    expect(() => parseSchema(CreateUserSchema, { ...valid, username: '' })).toThrow(ValidationError)
  })

  it('rejects invalid email', () => {
    expect(() => parseSchema(CreateUserSchema, { ...valid, email: 'not-an-email' })).toThrow(ValidationError)
  })

  it('rejects invalid role', () => {
    expect(() => parseSchema(CreateUserSchema, { ...valid, role: 'superuser' })).toThrow(ValidationError)
  })

  it('rejects missing role', () => {
    const { role, ...rest } = valid
    expect(() => parseSchema(CreateUserSchema, rest)).toThrow(ValidationError)
  })
})

// ── UpdateUserSchema ──────────────────────────────────────────────────────────

describe('UpdateUserSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(() => parseSchema(UpdateUserSchema, {})).not.toThrow()
  })

  it('accepts valid role update', () => {
    const result = parseSchema(UpdateUserSchema, { role: 'viewer' })
    expect(result.role).toBe('viewer')
  })

  it('accepts valid status update', () => {
    const result = parseSchema(UpdateUserSchema, { status: 'inactive' })
    expect(result.status).toBe('inactive')
  })

  it('strips unknown fields', () => {
    const result = parseSchema(UpdateUserSchema, { role: 'analyst', foo: 'bar' })
    expect(result).not.toHaveProperty('foo')
  })

  it('rejects invalid role', () => {
    expect(() => parseSchema(UpdateUserSchema, { role: 'god' })).toThrow(ValidationError)
  })

  it('rejects invalid status', () => {
    expect(() => parseSchema(UpdateUserSchema, { status: 'banned' })).toThrow(ValidationError)
  })
})

// ── CreateRecordSchema ────────────────────────────────────────────────────────

describe('CreateRecordSchema', () => {
  const valid = {
    amount: 100.5,
    type: 'income' as const,
    category: 'Salary',
    date: '2024-01-15',
  }

  it('accepts a valid payload', () => {
    expect(() => parseSchema(CreateRecordSchema, valid)).not.toThrow()
  })

  it('accepts optional notes', () => {
    const result = parseSchema(CreateRecordSchema, { ...valid, notes: 'bonus' })
    expect(result.notes).toBe('bonus')
  })

  it('strips unknown fields', () => {
    const result = parseSchema(CreateRecordSchema, { ...valid, extra: 'x' })
    expect(result).not.toHaveProperty('extra')
  })

  it('rejects non-positive amount', () => {
    expect(() => parseSchema(CreateRecordSchema, { ...valid, amount: 0 })).toThrow(ValidationError)
    expect(() => parseSchema(CreateRecordSchema, { ...valid, amount: -5 })).toThrow(ValidationError)
  })

  it('rejects invalid type', () => {
    expect(() => parseSchema(CreateRecordSchema, { ...valid, type: 'transfer' })).toThrow(ValidationError)
  })

  it('rejects empty category', () => {
    expect(() => parseSchema(CreateRecordSchema, { ...valid, category: '' })).toThrow(ValidationError)
  })

  it('rejects invalid date format', () => {
    expect(() => parseSchema(CreateRecordSchema, { ...valid, date: '2024/01/15' })).toThrow(ValidationError)
    expect(() => parseSchema(CreateRecordSchema, { ...valid, date: '15-01-2024' })).toThrow(ValidationError)
  })

  it('accepts YYYY-MM-DD date format', () => {
    expect(() => parseSchema(CreateRecordSchema, { ...valid, date: '2024-12-31' })).not.toThrow()
  })
})

// ── UpdateRecordSchema ────────────────────────────────────────────────────────

describe('UpdateRecordSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(() => parseSchema(UpdateRecordSchema, {})).not.toThrow()
  })

  it('accepts partial update', () => {
    const result = parseSchema(UpdateRecordSchema, { amount: 200, category: 'Rent' })
    expect(result.amount).toBe(200)
    expect(result.category).toBe('Rent')
  })

  it('strips unknown fields', () => {
    const result = parseSchema(UpdateRecordSchema, { amount: 50, unknown: true })
    expect(result).not.toHaveProperty('unknown')
  })

  it('rejects non-positive amount', () => {
    expect(() => parseSchema(UpdateRecordSchema, { amount: -1 })).toThrow(ValidationError)
  })

  it('rejects invalid date format', () => {
    expect(() => parseSchema(UpdateRecordSchema, { date: '01/15/2024' })).toThrow(ValidationError)
  })
})

// ── RecordFilterSchema ────────────────────────────────────────────────────────

describe('RecordFilterSchema', () => {
  it('accepts empty object', () => {
    expect(() => parseSchema(RecordFilterSchema, {})).not.toThrow()
  })

  it('accepts all valid filters', () => {
    const result = parseSchema(RecordFilterSchema, {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      category: 'Rent',
      type: 'expense',
      page: '2',
      limit: '10',
      search: 'bonus',
    })
    expect(result.page).toBe(2)
    expect(result.limit).toBe(10)
    expect(result.type).toBe('expense')
  })

  it('coerces page and limit from strings', () => {
    const result = parseSchema(RecordFilterSchema, { page: '3', limit: '25' })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(25)
  })

  it('rejects non-positive page', () => {
    expect(() => parseSchema(RecordFilterSchema, { page: '0' })).toThrow(ValidationError)
  })

  it('rejects invalid date format in start_date', () => {
    expect(() => parseSchema(RecordFilterSchema, { start_date: '2024/01/01' })).toThrow(ValidationError)
  })

  it('strips unknown fields', () => {
    const result = parseSchema(RecordFilterSchema, { category: 'Food', extra: 'ignored' })
    expect(result).not.toHaveProperty('extra')
  })
})

// ── parseSchema helper ────────────────────────────────────────────────────────

describe('parseSchema', () => {
  it('throws ValidationError with field-level details', () => {
    try {
      parseSchema(CreateUserSchema, { username: '', email: 'bad', role: 'admin' })
      fail('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError)
      const ve = err as ValidationError
      expect(ve.fieldErrors.length).toBeGreaterThan(0)
      expect(ve.fieldErrors[0]).toHaveProperty('field')
      expect(ve.fieldErrors[0]).toHaveProperty('message')
    }
  })

  it('returns parsed data on success', () => {
    const data = parseSchema(CreateUserSchema, {
      username: 'bob',
      email: 'bob@example.com',
      role: 'viewer',
    })
    expect(data.username).toBe('bob')
    expect(data.role).toBe('viewer')
  })
})
