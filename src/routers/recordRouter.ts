import { Router } from 'express'
import { requireRole } from '../middleware/rbac'
import { validateBody, validateQuery } from '../middleware/validate'
import { CreateRecordSchema, UpdateRecordSchema, RecordFilterSchema } from '../validators'
import * as handlers from '../handlers/recordHandlers'

const router = Router()

// Read routes: analyst and admin
router.get('/', requireRole(['analyst', 'admin']), validateQuery(RecordFilterSchema), handlers.listRecords)
router.get('/:id', requireRole(['analyst', 'admin']), handlers.getRecordById)

// Write/delete routes: admin only
router.post('/', requireRole(['admin']), validateBody(CreateRecordSchema), handlers.createRecord)
router.patch('/:id', requireRole(['admin']), validateBody(UpdateRecordSchema), handlers.updateRecord)
router.delete('/:id', requireRole(['admin']), handlers.deleteRecord)
router.patch('/:id/restore', requireRole(['admin']), handlers.restoreRecord)

export default router
