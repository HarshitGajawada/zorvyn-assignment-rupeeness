import { UserRepository } from '../repositories/UserRepository'
import userRepository from '../repositories/UserRepository'
import { NotFoundError } from '../errors'
import { User, Role } from '../types'

export class UserService {
  constructor(private repo: UserRepository) {}

  async createUser(data: { username: string; email: string; role: Role; passwordHash?: string }): Promise<User> {
    return this.repo.create(data)
  }

  async listUsers(): Promise<User[]> {
    return this.repo.findAll()
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.repo.findById(id)
    if (!user) throw new NotFoundError(`User with id ${id} not found`)
    return user
  }

  async updateUser(id: string, data: Partial<{ role: Role; status: 'active' | 'inactive' }>): Promise<User> {
    const user = await this.repo.update(id, data)
    if (!user) throw new NotFoundError(`User with id ${id} not found`)
    return user
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.repo.delete(id)
    if (!deleted) throw new NotFoundError(`User with id ${id} not found`)
  }
}

export default new UserService(userRepository)
