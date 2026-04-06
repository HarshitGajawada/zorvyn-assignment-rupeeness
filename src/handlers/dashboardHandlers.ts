import { Request, Response, NextFunction } from 'express'
import dashboardService from '../services/DashboardService'

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { start_date, end_date } = req.query as { start_date?: string; end_date?: string }
    const filters = { start_date, end_date }
    const summary = await dashboardService.getSummary(filters)
    res.status(200).json(summary)
  } catch (err) {
    next(err)
  }
}

export async function getCategorySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await dashboardService.getCategorySummary()
    res.status(200).json(categories)
  } catch (err) {
    next(err)
  }
}

export async function getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const records = await dashboardService.getRecentActivity()
    res.status(200).json(records)
  } catch (err) {
    next(err)
  }
}

export async function getMonthlyTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const trends = await dashboardService.getMonthlyTrends()
    res.status(200).json(trends)
  } catch (err) {
    next(err)
  }
}

export async function getWeeklyTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const trends = await dashboardService.getWeeklyTrends()
    res.status(200).json(trends)
  } catch (err) {
    next(err)
  }
}
