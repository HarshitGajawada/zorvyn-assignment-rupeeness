import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db'
import { UnauthenticatedError } from '../errors'

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return next(new UnauthenticatedError('Username and password are required'))
    }

    const user = await db('users').where({ username }).first()

    if (!user || !user.password_hash) {
      return next(new UnauthenticatedError('Invalid credentials'))
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return next(new UnauthenticatedError('Invalid credentials'))
    }

    const secret = process.env.JWT_SECRET ?? 'dev-secret'
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '1h') as jwt.SignOptions['expiresIn']

    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn }
    )

    res.status(200).json({ token })
  } catch (err) {
    next(err)
  }
}
