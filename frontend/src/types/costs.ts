/** Cost data for a single flavor, computed server-side. */
export interface FlavorCostRow {
  _id: string;
  name: string;
  sourceRecipeId?: string;
  sourceRecipeName?: string;

  // Cost breakdown
  baseMixCostPerKg: number;
  mixInsCostPerKg: number;
  totalCostPerKg: number;

  // Overrun
  overrunPercent: number;
  overrunSource: 'historical' | 'override' | 'none';

  // Final costs
  costPerLiter: number;

  // Feina (from parent recipe)
  feina?: 'Baix' | 'Mitjà' | 'Alt' | 'Molt alt';

  // Sale price (set manually by user)
  salePriceSmall?: number;
}
