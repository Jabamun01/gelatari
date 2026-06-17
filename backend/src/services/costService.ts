import Recipe from '../models/Recipe';
import Ingredient from '../models/Ingredient';
import IceCreamFlavor from '../models/IceCreamFlavor';
import { Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FlavorCostRow {
  _id: string;
  name: string;
  sourceRecipeId?: string;
  sourceRecipeName?: string;

  // Cost breakdown
  baseMixCostPerKg: number;       // cost of 1 kg of base mix (recipe cost, normalized)
  mixInsCostPerKg: number;        // cost of mix-ins per kg of mix used
  totalCostPerKg: number;         // baseMixCostPerKg + mixInsCostPerKg

  // Overrun
  overrunPercent: number;
  overrunSource: 'historical' | 'override' | 'none';

  // Final costs
  costPerLiter: number;

  // Feina (from recipe)
  feina?: 'Baix' | 'Mitjà' | 'Alt' | 'Molt alt';

  // Sale price
  salePriceSmall?: number;

  // Missing price tracking
  missingBaseIngredientNames: string[];
  missingMixInIngredientNames: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_RECURSION_DEPTH = 100;

interface CostResult {
  cost: number;
  missingIngredientNames: string[];
}

/**
 * Recursively compute the cost per kg (1000g) of a recipe.
 *
 * recipeCost = Σ(ingredient grams × ingredient.costPerKg / 1000)
 *            + Σ(linked recipe grams × linkedRecipeCost / 1000)
 *
 * The visited set prevents infinite loops from circular recipe dependencies.
 * depth prevents stack overflows from pathological nesting.
 */
async function computeRecipeCostPerKg(
  recipeId: string,
  visited: Set<string>,
  depth: number = 0,
): Promise<CostResult> {
  if (depth > MAX_RECURSION_DEPTH) {
    console.warn(`[costService] Max recursion depth (${MAX_RECURSION_DEPTH}) reached for recipe ${recipeId}`);
    return { cost: 0, missingIngredientNames: [] };
  }

  if (visited.has(recipeId)) {
    console.warn(`[costService] Circular recipe dependency detected: ${recipeId}`);
    return { cost: 0, missingIngredientNames: [] };
  }

  visited.add(recipeId);

  const recipe = await Recipe.findById(recipeId)
    .populate('ingredients.ingredient', 'costPerKg name')
    .populate('linkedRecipes.recipe', 'name')
    .exec();

  if (!recipe) {
    console.warn(`[costService] Recipe not found: ${recipeId}`);
    visited.delete(recipeId);
    return { cost: 0, missingIngredientNames: [] };
  }

  const missing = new Set<string>();

  // Direct ingredients
  let directTotal = 0;
  for (const ing of recipe.ingredients) {
    const ingData = ing.ingredient as any;
    const costPerKg = ingData?.costPerKg;
    if (costPerKg == null && ingData?.name) {
      missing.add(ingData.name);
    }
    const grams = ing.amountGrams || 0;
    directTotal += (grams / 1000) * (costPerKg ?? 0);
  }

  // Linked recipes (recursive)
  let linkedTotal = 0;
  for (const linked of recipe.linkedRecipes) {
    const linkedRecipeId = (linked.recipe as any)?._id?.toString();
    if (linkedRecipeId) {
      const linkedResult = await computeRecipeCostPerKg(linkedRecipeId, visited, depth + 1);
      const grams = linked.amountGrams || 0;
      linkedTotal += (grams / 1000) * linkedResult.cost;
      linkedResult.missingIngredientNames.forEach(name => missing.add(name));
    }
  }

  visited.delete(recipeId);
  return { cost: directTotal + linkedTotal, missingIngredientNames: [...missing] };
}

/**
 * Compute the effective overrun percent for a recipe.
 * Prefers manual override; falls back to historical average; defaults to 0.
 */
function getEffectiveOverrun(recipe: any): {
  overrunPercent: number;
  overrunSource: 'historical' | 'override' | 'none';
} {
  if (
    recipe.overrunOverridePercent !== undefined &&
    recipe.overrunOverridePercent !== null
  ) {
    return {
      overrunPercent: recipe.overrunOverridePercent,
      overrunSource: 'override' as const,
    };
  }

  if (
    recipe.totalMixConvertedKg &&
    recipe.totalMixConvertedKg > 0 &&
    recipe.totalFrozenProducedL !== undefined
  ) {
    const overrun =
      (recipe.totalFrozenProducedL / recipe.totalMixConvertedKg - 1) * 100;
    return {
      overrunPercent: Math.max(0, overrun), // overrun can't be negative
      overrunSource: 'historical' as const,
    };
  }

  return { overrunPercent: 0, overrunSource: 'none' as const };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute cost data for all ice cream flavors.
 *
 * Returns an array of FlavorCostRow with:
 * - base mix cost per kg (from the parent recipe, including linked sub-recipes)
 * - mix-in cost per kg (from the flavor's mixIns, using ingredient costPerKg)
 * - total cost per kg (base + mix-ins)
 * - effective overrun % and its source
 * - cost per liter (totalCostPerKg / (1 + overrun/100))
 * - feina (from the parent recipe)
 * - salePriceSmall (from the flavor, if set)
 */
export async function computeFlavorCosts(): Promise<FlavorCostRow[]> {
  const flavors = await IceCreamFlavor.find()
    .populate('mixIns.ingredient', 'costPerKg name')
    .populate('sourceRecipeId', 'name feina overrunOverridePercent iceCreamMixKg totalMixConvertedKg totalFrozenProducedL')
    .sort({ name: 1 })
    .exec();

  const results: FlavorCostRow[] = [];

  for (const flavor of flavors) {
    const recipe = flavor.sourceRecipeId as any;
    const recipeId = recipe?._id?.toString();

    let baseMixCostPerKg = 0;
    let feina: FlavorCostRow['feina'] = undefined;
    let overrunPercent = 0;
    let overrunSource: FlavorCostRow['overrunSource'] = 'none';

    let missingBaseIngredientNames: string[] = [];
    let missingMixInIngredientNames: string[] = [];

    if (recipe && recipeId) {
      // Compute base mix cost (recursive)
      const costResult = await computeRecipeCostPerKg(recipeId, new Set());
      baseMixCostPerKg = costResult.cost;
      missingBaseIngredientNames = costResult.missingIngredientNames;

      // Overrun
      const overrunInfo = getEffectiveOverrun(recipe);
      overrunPercent = overrunInfo.overrunPercent;
      overrunSource = overrunInfo.overrunSource;

      // Feina
      feina = recipe.feina || undefined;
    }

    // Mix-in costs
    let mixInsCostPerKg = 0;
    for (const mixIn of flavor.mixIns || []) {
      const ingData = mixIn.ingredient as any;
      const costPerKg = ingData?.costPerKg;
      if (costPerKg == null && ingData?.name) {
        missingMixInIngredientNames.push(ingData.name);
      }
      mixInsCostPerKg += (mixIn.amountPerKg / 1000) * (costPerKg ?? 0);
    }

    const totalCostPerKg = baseMixCostPerKg + mixInsCostPerKg;
    const overrunFactor = 1 + overrunPercent / 100;
    const costPerLiter = overrunFactor > 0 ? totalCostPerKg / overrunFactor : totalCostPerKg;

    results.push({
      _id: (flavor._id as string).toString(),
      name: flavor.name,
      sourceRecipeId: recipeId,
      sourceRecipeName: recipe?.name,
      baseMixCostPerKg: round2(baseMixCostPerKg),
      mixInsCostPerKg: round2(mixInsCostPerKg),
      totalCostPerKg: round2(totalCostPerKg),
      overrunPercent: round2(overrunPercent),
      overrunSource,
      costPerLiter: round2(costPerLiter),
      feina,
      salePriceSmall: flavor.salePriceSmall ?? undefined,
      missingBaseIngredientNames,
      missingMixInIngredientNames,
    });
  }

  return results;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
