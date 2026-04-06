import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { parseSchema } from '../validators'

export function validateBody<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = parseSchema(schema, req.body)
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function validateQuery<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = parseSchema(schema, req.query) as any
      next()
    } catch (err) {
      next(err)
    }
  }
}
