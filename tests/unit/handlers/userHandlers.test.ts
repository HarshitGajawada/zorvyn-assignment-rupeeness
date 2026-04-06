import { Request, Response, NextFunction } from 'express'
import { NotFoundError } from '../../../src/errors'
import { User } from '../../../src/types'

// Mock the default userService export before importing handlers
jest.mock('../../../src/services/UserService', () => ({
  __esModule: true,
  default: {
    createUser: jest.fn(),
    listUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
}))

import userService from '../../../src/services/UserService'
import * as handlers from '../../../src/handlers/userHandlers'

const mockUserService = userService as jest.Mocked<typeof userService>

const mockUser: User = {
  id: 'abc-123',
  username: 'testuser',
  email: 'test@example.com',
  role: 'viewer',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

function makeRes(): jest.Mocked<Response> {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>
  return res
}

function makeNext(): jest.MockedFunction<NextFunction> {
  return jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('createUser', () => {
  it('returns 201 with the created user', async () => {
    mockUserService.createUser.mockResolvedValue(mockUser)
    const req = { body: { username: 'testuser', email: 'test@example.com', role: 'viewer' } } as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.createUser(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(mockUser)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when service throws', async () => {
    const err = new Error('DB error')
    mockUserService.createUser.mockRejectedValue(err)
    const req = { body: { username: 'testuser', email: 'test@example.com', role: 'viewer' } } as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.createUser(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('listUsers', () => {
  it('returns 200 with array of users', async () => {
    mockUserService.listUsers.mockResolvedValue([mockUser])
    const req = {} as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.listUsers(req, res, next)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([mockUser])
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when service throws', async () => {
    const err = new Error('DB error')
    mockUserService.listUsers.mockRejectedValue(err)
    const req = {} as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.listUsers(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
  })
})

describe('getUserById', () => {
  it('returns 200 with the user', async () => {
    mockUserService.getUserById.mockResolvedValue(mockUser)
    const req = { params: { id: 'abc-123' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getUserById(req, res, next)

    expect(mockUserService.getUserById).toHaveBeenCalledWith('abc-123')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(mockUser)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) with NotFoundError when user does not exist', async () => {
    const err = new NotFoundError('User with id missing not found')
    mockUserService.getUserById.mockRejectedValue(err)
    const req = { params: { id: 'missing' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.getUserById(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
  })
})

describe('updateUser', () => {
  it('returns 200 with the updated user', async () => {
    const updated = { ...mockUser, role: 'admin' as const }
    mockUserService.updateUser.mockResolvedValue(updated)
    const req = { params: { id: 'abc-123' }, body: { role: 'admin' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.updateUser(req, res, next)

    expect(mockUserService.updateUser).toHaveBeenCalledWith('abc-123', { role: 'admin' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(updated)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when service throws', async () => {
    const err = new NotFoundError('User with id missing not found')
    mockUserService.updateUser.mockRejectedValue(err)
    const req = { params: { id: 'missing' }, body: { role: 'admin' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.updateUser(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
  })
})

describe('deleteUser', () => {
  it('returns 204 with no body', async () => {
    mockUserService.deleteUser.mockResolvedValue(undefined)
    const req = { params: { id: 'abc-123' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.deleteUser(req, res, next)

    expect(mockUserService.deleteUser).toHaveBeenCalledWith('abc-123')
    expect(res.status).toHaveBeenCalledWith(204)
    expect(res.send).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) with NotFoundError when user does not exist', async () => {
    const err = new NotFoundError('User with id missing not found')
    mockUserService.deleteUser.mockRejectedValue(err)
    const req = { params: { id: 'missing' } } as unknown as Request
    const res = makeRes()
    const next = makeNext()

    await handlers.deleteUser(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
  })
})
