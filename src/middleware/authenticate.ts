import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthenticatedError } from '../errors'
import { Role } from '../types'

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthenticatedError('Missing or invalid Authorization header'))
  }

  const token = authHeader.slice(7)
  const secret = process.env.JWT_SECRET ?? 'dev-secret'

  try {
    const payload = jwt.verify(token, secret) as { id: string; role: Role }
    ;(req as any).user = { id: payload.id, role: payload.role }
    next()
  } catch (err) {
    next(new UnauthenticatedError('Invalid or expired token'))
  }
}
