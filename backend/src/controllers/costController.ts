import { Request, Response } from 'express';
import { computeFlavorCosts } from '../services/costService';

/**
 * GET /api/costs/flavors
 * Returns computed cost data for all ice cream / sorbet flavors.
 */
export const getFlavorCostsHandler = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const costs = await computeFlavorCosts();
    res.status(200).json(costs);
  } catch (error) {
    console.error('Error computing flavor costs:', error);
    res.status(500).json({ message: 'Failed to compute flavor costs.' });
  }
};
