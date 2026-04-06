import { Request, Response, NextFunction } from 'express'
import { ValidationError, NotFoundError, ConflictError, UnauthenticatedError, ForbiddenError } from '../errors'

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message, errors: err.fieldErrors })
    return
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message })
    return
  }
  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message })
    return
  }
  if (err instanceof UnauthenticatedError) {
    res.status(401).json({ error: err.message })
    return
  }
  if (err instanceof ForbiddenError) {
    res.status(403).json({ error: err.message })
    return
  }
  // Unexpected error — log full details, return generic message
  console.error(err)
  res.status(500).json({ error: 'An unexpected error occurred' })
}
