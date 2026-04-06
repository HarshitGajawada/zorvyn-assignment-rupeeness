import { Request, Response, NextFunction } from 'express'
import { errorHandler } from '../../../src/middleware/errorHandler'
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthenticatedError,
  ForbiddenError,
} from '../../../src/errors'

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response
  return res
}

const req = {} as Request
const next = jest.fn() as NextFunction

describe('errorHandler', () => {
  beforeEach(() => jest.clearAllMocks())

  it('maps ValidationError → 400 with fieldErrors', () => {
    const res = makeRes()
    const err = new ValidationError('Validation failed', [{ field: 'email', message: 'Invalid email' }])
    errorHandler(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      errors: [{ field: 'email', message: 'Invalid email' }],
    })
  })

  it('maps NotFoundError → 404', () => {
    const res = makeRes()
    errorHandler(new NotFoundError(), req, res, next)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource not found' })
  })

  it('maps ConflictError → 409', () => {
    const res = makeRes()
    errorHandler(new ConflictError(), req, res, next)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource already exists' })
  })

  it('maps UnauthenticatedError → 401', () => {
    const res = makeRes()
    errorHandler(new UnauthenticatedError(), req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' })
  })

  it('maps ForbiddenError → 403', () => {
    const res = makeRes()
    errorHandler(new ForbiddenError(), req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' })
  })

  it('maps unexpected errors → 500 with generic message', () => {
    const res = makeRes()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    errorHandler(new Error('Something exploded'), req, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'An unexpected error occurred' })
    consoleSpy.mockRestore()
  })

  it('logs unexpected errors server-side', () => {
    const res = makeRes()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('DB connection lost')
    errorHandler(err, req, res, next)
    expect(consoleSpy).toHaveBeenCalledWith(err)
    consoleSpy.mockRestore()
  })

  it('uses custom messages when provided', () => {
    const res = makeRes()
    errorHandler(new NotFoundError('User not found'), req, res, next)
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' })
  })

  it('ValidationError with empty fieldErrors still returns 400', () => {
    const res = makeRes()
    errorHandler(new ValidationError('Bad input'), req, res, next)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad input', errors: [] })
  })
})
