import { z } from 'zod'
import { ValidationError } from '../errors'
import { FieldError } from '../types'

// ── Schemas ──────────────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['viewer', 'analyst', 'admin']),
}).strip()

export const UpdateUserSchema = z.object({
  role: z.enum(['viewer', 'analyst', 'admin']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
}).strip()

export const CreateRecordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid ISO 8601 date (YYYY-MM-DD)'),
  notes: z.string().optional(),
}).strip()

export const UpdateRecordSchema = z.object({
  amount: z.number().positive().optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
}).strip()

export const RecordFilterSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
}).strip()

// ── Inferred Types ────────────────────────────────────────────────────────────

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type CreateRecordInput = z.infer<typeof CreateRecordSchema>
export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>
export type RecordFilterInput = z.infer<typeof RecordFilterSchema>

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Parses `data` against `schema`. Returns the parsed (and stripped) value on
 * success, or throws a `ValidationError` with field-level details on failure.
 */
export function parseSchema<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }

  const fieldErrors: FieldError[] = result.error.errors.map((issue) => ({
    field: issue.path.join('.') || 'unknown',
    message: issue.message,
  }))

  throw new ValidationError('Validation failed', fieldErrors)
}
