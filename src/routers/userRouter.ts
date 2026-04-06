import { Router } from 'express'
import { requireRole } from '../middleware/rbac'
import { validateBody } from '../middleware/validate'
import { CreateUserSchema, UpdateUserSchema } from '../validators'
import * as handlers from '../handlers/userHandlers'

const router = Router()

router.use(requireRole(['admin']))

router.post('/', validateBody(CreateUserSchema), handlers.createUser)
router.get('/', handlers.listUsers)
router.get('/:id', handlers.getUserById)
router.patch('/:id', validateBody(UpdateUserSchema), handlers.updateUser)
router.delete('/:id', handlers.deleteUser)

export default router
