import { Router } from 'express'
import { login } from '../handlers/authHandlers'

const router = Router()
router.post('/login', login)
export default router
