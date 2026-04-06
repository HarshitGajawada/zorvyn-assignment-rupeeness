import express from 'express'
import { errorHandler } from './middleware/errorHandler'
import { authenticate } from './middleware/authenticate'
import userRouter from './routers/userRouter'
import recordRouter from './routers/recordRouter'
import dashboardRouter from './routers/dashboardRouter'
import authRouter from './routers/authRouter'

export function createApp() {
  const app = express()

  app.use(express.json())

  app.use('/auth', authRouter)
  app.use('/users', authenticate, userRouter)
  app.use('/records', authenticate, recordRouter)
  app.use('/dashboard', authenticate, dashboardRouter)

  app.use(errorHandler)

  return app
}

export default createApp()
