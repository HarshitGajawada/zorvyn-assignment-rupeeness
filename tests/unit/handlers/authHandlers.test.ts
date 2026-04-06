import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UnauthenticatedError } from '../../../src/errors'

// Mock the db module before importing the handler
jest.mock('../../../src/db', () => ({
  __esModule: true,
  default: jest.fn(),
}))

import db from '../../../src/db'
import { login } from '../../../src/handlers/authHandlers'

const mockDb = db as jest.MockedFunction<typeof db>

function makeRes(): jest.Mocked<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>
}

function makeNext(): jest.MockedFunction<NextFunction> {
  return jest.fn()
}

const PASSWORD = 'secret123'
let PASSWORD_HASH: string

beforeAll(async () => {
  PASSWORD_HASH = await bcrypt.hash(PASSWORD, 10)
})

beforeEach(() => {
  jest.clearAllMocks()
})

function setupDbQuery(result: object | undefined) {
  const firstMock = jest.fn().mockResolvedValue(result)
  const whereMock = jest.fn().mockReturnValue({ first: firstMock })
  mockDb.mockReturnValue({ where: whereMock } as any)
}

describe('login handler', () => {
  it('returns 200 with a JWT token on valid credentials', async () => {
    setupDbQuery({ id: 'user-1', role: 'analyst', password_hash: PASSWORD_HASH })

    const req = { body: { username: 'alice', password: PASSWORD } } as Request
    const res = makeRes()
    const next = makeNext()

    await login(req, res, next)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }))
    expect(next).not.toHaveBeenCalled()
  })

  it('JWT payload contains id and role', async () => {
    setupDbQuery({ id: 'user-1', role: 'analyst', password_hash: PASSWORD_HASH })

    const req = { body: { username: 'alice', password: PASSWORD } } as Request
    const res = makeRes()
    const next = makeNext()

    await login(req, res, next)

    const { token } = (res.json as jest.Mock).mock.calls[0][0]
    const decoded = jwt.verify(token, 'dev-secret') as { id: string; role: string }
    expect(decoded.id).toBe('user-1')
    expect(decoded.role).toBe('analyst')
  })

  it('returns 401 when username is missing', async () => {
    const req = { body: { password: PASSWORD } } as Request
    const res = makeRes()
    const next = makeNext()

    await login(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError))
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 401 when password is missing', async () => {
    const req = { body: { username: 'alice' } } as Request
    const res = makeRes()
    const next = makeNext()

    await login(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError))
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 401 when user is not found', async () => {
    setupDbQuery(undefined)

    const req = { body: { username: 'nobody', password: PASSWORD } } as Request
    const res = makeRes()
    const next = makeNext()

    await login(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError))
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 401 on wrong password', async () => {
    setupDbQuery({ id: 'user-1', role: 'viewer', password_hash: PASSWORD_HASH })

    const req = { body: { username: 'alice', password: 'wrongpassword' } } as Request
    const res = makeRes()
    const next = makeNext()

    await login(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError))
    expect(res.status).not.toHaveBeenCalled()
  })
})
