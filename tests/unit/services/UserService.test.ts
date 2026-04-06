import { UserService } from '../../../src/services/UserService'
import { UserRepository } from '../../../src/repositories/UserRepository'
import { NotFoundError } from '../../../src/errors'
import { User, Role } from '../../../src/types'

const mockUser: User = {
  id: 'abc-123',
  username: 'testuser',
  email: 'test@example.com',
  role: 'viewer',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

function makeMockRepo(): jest.Mocked<UserRepository> {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>
}

describe('UserService', () => {
  let repo: jest.Mocked<UserRepository>
  let service: UserService

  beforeEach(() => {
    repo = makeMockRepo()
    service = new UserService(repo)
  })

  describe('createUser', () => {
    it('delegates to repo.create and returns the result', async () => {
      repo.create.mockResolvedValue(mockUser)
      const data = { username: 'testuser', email: 'test@example.com', role: 'viewer' as Role }
      const result = await service.createUser(data)
      expect(repo.create).toHaveBeenCalledWith(data)
      expect(result).toBe(mockUser)
    })
  })

  describe('listUsers', () => {
    it('delegates to repo.findAll and returns the result', async () => {
      repo.findAll.mockResolvedValue([mockUser])
      const result = await service.listUsers()
      expect(repo.findAll).toHaveBeenCalled()
      expect(result).toEqual([mockUser])
    })
  })

  describe('getUserById', () => {
    it('returns the user when repo finds it', async () => {
      repo.findById.mockResolvedValue(mockUser)
      const result = await service.getUserById('abc-123')
      expect(repo.findById).toHaveBeenCalledWith('abc-123')
      expect(result).toBe(mockUser)
    })

    it('throws NotFoundError when repo returns null', async () => {
      repo.findById.mockResolvedValue(null)
      await expect(service.getUserById('missing-id')).rejects.toThrow(NotFoundError)
      await expect(service.getUserById('missing-id')).rejects.toThrow('User with id missing-id not found')
    })
  })

  describe('updateUser', () => {
    it('returns the updated user when repo finds it', async () => {
      const updated = { ...mockUser, role: 'admin' as Role }
      repo.update.mockResolvedValue(updated)
      const result = await service.updateUser('abc-123', { role: 'admin' })
      expect(repo.update).toHaveBeenCalledWith('abc-123', { role: 'admin' })
      expect(result).toBe(updated)
    })

    it('throws NotFoundError when repo returns null', async () => {
      repo.update.mockResolvedValue(null)
      await expect(service.updateUser('missing-id', { role: 'admin' })).rejects.toThrow(NotFoundError)
      await expect(service.updateUser('missing-id', { role: 'admin' })).rejects.toThrow('User with id missing-id not found')
    })
  })

  describe('deleteUser', () => {
    it('resolves without error when repo returns true', async () => {
      repo.delete.mockResolvedValue(true)
      await expect(service.deleteUser('abc-123')).resolves.toBeUndefined()
      expect(repo.delete).toHaveBeenCalledWith('abc-123')
    })

    it('throws NotFoundError when repo returns false', async () => {
      repo.delete.mockResolvedValue(false)
      await expect(service.deleteUser('missing-id')).rejects.toThrow(NotFoundError)
      await expect(service.deleteUser('missing-id')).rejects.toThrow('User with id missing-id not found')
    })
  })
})
