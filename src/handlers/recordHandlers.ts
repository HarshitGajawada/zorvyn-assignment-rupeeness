import { Request, Response, NextFunction } from 'express'
import recordService from '../services/RecordService'

export async function createRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await recordService.createRecord({ ...req.body, createdBy: (req as any).user.id })
    res.status(201).json(record)
  } catch (err) {
    next(err)
  }
}

export async function listRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const records = await recordService.listRecords(req.query as any)
    res.status(200).json(records)
  } catch (err) {
    next(err)
  }
}

export async function getRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await recordService.getRecordById(req.params.id)
    res.status(200).json(record)
  } catch (err) {
    next(err)
  }
}

export async function updateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await recordService.updateRecord(req.params.id, req.body)
    res.status(200).json(record)
  } catch (err) {
    next(err)
  }
}

export async function deleteRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await recordService.deleteRecord(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function restoreRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await recordService.restoreRecord(req.params.id)
    res.status(200).json(record)
  } catch (err) {
    next(err)
  }
}
