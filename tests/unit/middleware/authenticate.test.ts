import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authenticate } from '../../../src/middleware/authenticate'
import { UnauthenticatedError } from '../../../src/errors'

const SECRET = 'dev-secret'

function makeReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request
}

const res = {} as Response

describe('authenticate middleware', () => {
  it('sets req.user and calls next() when token is valid', () => {
    const token = jwt.sign({ id: 'user-1', role: 'admin' }, SECRET)
    const req = makeReq(`Bearer ${token}`)
    const next = jest.fn() as NextFunction

    authenticate(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect((req as any).user).toEqual({ id: 'user-1', role: 'admin' })
  })

  it('calls next(UnauthenticatedError) when Authorization header is missing', () => {
    const req = makeReq()
    const next = jest.fn() as NextFunction

    authenticate(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError))
  })

  it("calls next(UnauthenticatedError) when header doesn't start with 'Bearer '", () => {
    const token = jwt.sign({ id: 'user-1', role: 'viewer' }, SECRET)
    const req = makeReq(`Token ${token}`)
    const next = jest.fn() as NextFunction

    authenticate(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError))
  })

  it('calls next(UnauthenticatedError) when token is expired', () => {
    const token = jwt.sign({ id: 'user-1', role: 'analyst' }, SECRET, { expiresIn: -1 })
    const req = makeReq(`Bearer ${token}`)
    const next = jest.fn() as NextFunction

    authenticate(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError))
  })

  it('calls next(UnauthenticatedError) when token has invalid signature', () => {
    const token = jwt.sign({ id: 'user-1', role: 'admin' }, 'wrong-secret')
    const req = makeReq(`Bearer ${token}`)
    const next = jest.fn() as NextFunction

    authenticate(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError))
  })
})
