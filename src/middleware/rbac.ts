import { Request, Response, NextFunction } from 'express'
import { Role } from '../types'
import { UnauthenticatedError, ForbiddenError } from '../errors'

export function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as { id: string; role: Role } | undefined
    if (!user) {
      return next(new UnauthenticatedError())
    }
    if (!roles.includes(user.role)) {
      return next(new ForbiddenError())
    }
    next()
  }
}
