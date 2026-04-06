import { Router } from 'express'
import { requireRole } from '../middleware/rbac'
import * as handlers from '../handlers/dashboardHandlers'

const router = Router()

router.use(requireRole(['viewer', 'analyst', 'admin']))

router.get('/summary', handlers.getSummary)
router.get('/categories', handlers.getCategorySummary)
router.get('/recent', handlers.getRecentActivity)
router.get('/trends/monthly', handlers.getMonthlyTrends)
router.get('/trends/weekly', handlers.getWeeklyTrends)

export default router
