import { Request, Response, NextFunction } from 'express';
import * as paradetaIncomeService from '../services/paradetaIncomeService';

// ---------------------------------------------------------------------------
// GET /api/paradeta-income
// ---------------------------------------------------------------------------
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, year, month, limit, offset } = req.query;
    const result = await paradetaIncomeService.getIncomes({
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
      year: year ? parseInt(year as string, 10) : undefined,
      month: month ? parseInt(month as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/paradeta-income/stats
// ---------------------------------------------------------------------------
export const stats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate } = req.query;
    const result = await paradetaIncomeService.getStats(
      fromDate as string | undefined,
      toDate as string | undefined,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/paradeta-income/grouped-stats
// ---------------------------------------------------------------------------
export const groupedStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groupBy, fromDate, toDate } = req.query;
    const result = await paradetaIncomeService.getGroupedStats(
      (groupBy as 'month' | 'week' | 'year') || 'month',
      fromDate as string | undefined,
      toDate as string | undefined,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/paradeta-income/export
// ---------------------------------------------------------------------------
export const exportData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await paradetaIncomeService.exportAll();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/paradeta-income/:id
// ---------------------------------------------------------------------------
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await paradetaIncomeService.getIncomeById(req.params.id);
    if (!record) {
      res.status(404).json({ message: 'Registre no trobat.' });
      return;
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/paradeta-income
// ---------------------------------------------------------------------------
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await paradetaIncomeService.createIncome(req.body);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/paradeta-income/:id
// ---------------------------------------------------------------------------
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await paradetaIncomeService.updateIncome(req.params.id, req.body);
    res.json(record);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/paradeta-income/:id
// ---------------------------------------------------------------------------
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await paradetaIncomeService.deleteIncome(req.params.id);
    res.json({ message: 'Registre eliminat.' });
  } catch (err) {
    next(err);
  }
};
