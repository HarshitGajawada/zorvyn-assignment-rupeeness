import { Request, Response, NextFunction } from 'express'
import userService from '../services/UserService'
import { CreateUserSchema, UpdateUserSchema } from '../validators'
import { parseSchema } from '../validators'

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = parseSchema(CreateUserSchema, req.body)
    const user = await userService.createUser(data)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await userService.listUsers()
    res.status(200).json(users)
  } catch (err) {
    next(err)
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(req.params.id)
    res.status(200).json(user)
  } catch (err) {
    next(err)
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = parseSchema(UpdateUserSchema, req.body)
    const user = await userService.updateUser(req.params.id, data)
    res.status(200).json(user)
  } catch (err) {
    next(err)
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteUser(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
