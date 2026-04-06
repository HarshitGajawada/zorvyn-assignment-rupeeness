import { Request, Response, NextFunction } from 'express'
import { requireRole } from '../../../src/middleware/rbac'
import { UnauthenticatedError, ForbiddenError } from '../../../src/errors'
import { Role } from '../../../src/types'

function makeReq(user?: { id: string; role: Role }): Request {
  return { user } as unknown as Request
}

const res = {} as Response

describe('requireRole middleware', () => {
  describe('unauthenticated requests', () => {
    it('calls next with UnauthenticatedError when req.user is missing', () => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['admin'])(makeReq(undefined), res, next)
      expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError))
    })
  })

  describe('forbidden requests', () => {
    it('calls next with ForbiddenError when viewer tries admin-only endpoint', () => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['admin'])(makeReq({ id: '1', role: 'viewer' }), res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError))
    })

    it('calls next with ForbiddenError when analyst tries admin-only endpoint', () => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['admin'])(makeReq({ id: '1', role: 'analyst' }), res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError))
    })

    it('calls next with ForbiddenError when viewer tries analyst+admin endpoint', () => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['analyst', 'admin'])(makeReq({ id: '1', role: 'viewer' }), res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError))
    })
  })

  describe('permitted requests', () => {
    it('calls next() without error when admin accesses admin-only endpoint', () => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['admin'])(makeReq({ id: '1', role: 'admin' }), res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('calls next() without error when analyst accesses analyst+admin endpoint', () => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['analyst', 'admin'])(makeReq({ id: '1', role: 'analyst' }), res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('calls next() without error when viewer accesses dashboard endpoint', () => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['viewer', 'analyst', 'admin'])(makeReq({ id: '1', role: 'viewer' }), res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('calls next() without error when admin accesses dashboard endpoint', () => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['viewer', 'analyst', 'admin'])(makeReq({ id: '1', role: 'admin' }), res, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('role-specific permission matrix', () => {
    const allRoles: Role[] = ['viewer', 'analyst', 'admin']

    // Dashboard endpoints: all roles allowed
    it.each(allRoles)('%s can access dashboard endpoints', (role) => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['viewer', 'analyst', 'admin'])(makeReq({ id: '1', role }), res, next)
      expect(next).toHaveBeenCalledWith()
    })

    // Records read: analyst and admin only
    it.each(['analyst', 'admin'] as Role[])('%s can read records', (role) => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['analyst', 'admin'])(makeReq({ id: '1', role }), res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('viewer cannot read records', () => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['analyst', 'admin'])(makeReq({ id: '1', role: 'viewer' }), res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError))
    })

    // Records write/delete and users: admin only
    it.each(['viewer', 'analyst'] as Role[])('%s cannot write records or manage users', (role) => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['admin'])(makeReq({ id: '1', role }), res, next)
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError))
    })

    it('admin can write records and manage users', () => {
      const next = jest.fn() as unknown as NextFunction
      requireRole(['admin'])(makeReq({ id: '1', role: 'admin' }), res, next)
      expect(next).toHaveBeenCalledWith()
    })
  })
})
