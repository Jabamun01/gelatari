import IceCreamFlavor, { IIceCreamFlavor, IMixIn } from '../models/IceCreamFlavor';
import Recipe from '../models/Recipe';
import Ingredient from '../models/Ingredient';
import { updateIngredientStock } from './ingredientService';
import mongoose from 'mongoose';
import * as eventService from './iceCreamEventService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConvertMixToFrozenInput {
  mixKg: number;
  frozenLiters: number;
  largeContainers: number;
  smallContainers: number;
}

export interface SellContainerInput {
  containerType: 'large' | 'small';
  location: 'warehouse' | 'paradeta';
}

export interface MoveContainersInput {
  containerType: 'large' | 'small';
  count: number;
  from: 'warehouse' | 'paradeta';
  to: 'warehouse' | 'paradeta';
}

export interface CreateFlavorInput {
  name: string;
  sourceRecipeId: string;
  mixIns?: Array<{ ingredient: string; amountPerKg: number }>;
}

export interface UpdateFlavorInput {
  name?: string;
  essentialLarge?: boolean;
  essentialSmall?: boolean;
  mixIns?: Array<{ ingredient: string; amountPerKg: number }>;
}

export interface DashboardFlavor {
  _id: string;
  name: string;
  sourceRecipeId?: string;
  sourceRecipeName?: string;
  mixIns: Array<{
    ingredient: string;       // ObjectId
    ingredientName?: string;  // populated
    amountPerKg: number;
  }>;
  // Mix info pulled from the parent recipe
  iceCreamMixKg: number;
  overrunPercent: number;
  // Container counts (on the flavor itself)
  totalFrozenLiters: number;
  totalLargeContainers: number;
  totalLargeLiters: number;
  totalSmallCount: number;
  largeWarehouseContainers: number;
  largeWarehouseLiters: number;
  largeParadetaContainers: number;
  largeParadetaLiters: number;
  smallWarehouseCount: number;
  smallParadetaCount: number;
  essentialLarge: boolean;
  essentialSmall: boolean;
  paradetaTotalLiters: number;
  warehouseTotalLiters: number;
  alerts: {
    paradetaLow: boolean;
    overallLow: boolean;
  };
}

// Thresholds for essential-flavor alerts (tweak as needed)
const PARADETA_LOW_THRESHOLD_LARGE_L = 15;
const PARADETA_LOW_THRESHOLD_SMALL_COUNT = 5;
const OVERALL_LOW_THRESHOLD_LARGE_L = 25;
const OVERALL_LOW_THRESHOLD_SMALL_COUNT = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

/**
 * Build a typed dashboard item from a flavor document + recipe mix data.
 */
const toDashboardItem = (
  f: IIceCreamFlavor & { sourceRecipeId?: any },
  recipeMixKg: number,
  recipeOverrunPercent: number,
): DashboardFlavor => {
  const totalLargeL = f.largeWarehouseLiters + f.largeParadetaLiters;
  const totalSmall = f.smallWarehouseCount + f.smallParadetaCount;
  const paradetaL = f.largeParadetaLiters + f.smallParadetaCount;
  const warehouseL = f.largeWarehouseLiters + f.smallWarehouseCount;
  const totalFrozenL = totalLargeL + totalSmall;

  // Alert logic
  let paradetaLow = false;
  let overallLow = false;

  if (f.essentialLarge || f.essentialSmall) {
    const paradetaLargeL = f.largeParadetaLiters;
    const paradetaSmallCount = f.smallParadetaCount;
    const totalLargeLiters = totalLargeL;
    const totalSmallCount = totalSmall;

    if (f.essentialLarge) {
      if (paradetaLargeL < PARADETA_LOW_THRESHOLD_LARGE_L) paradetaLow = true;
      if (totalLargeLiters < OVERALL_LOW_THRESHOLD_LARGE_L) overallLow = true;
    }
    if (f.essentialSmall) {
      if (paradetaSmallCount < PARADETA_LOW_THRESHOLD_SMALL_COUNT) paradetaLow = true;
      if (totalSmallCount < OVERALL_LOW_THRESHOLD_SMALL_COUNT) overallLow = true;
    }
  }

  // Extract source recipe info
  const sourceRecipeId = f.sourceRecipeId
    ? (typeof f.sourceRecipeId === 'object' && f.sourceRecipeId._id
        ? f.sourceRecipeId._id.toString()
        : f.sourceRecipeId.toString())
    : undefined;
  const sourceRecipeName =
    f.sourceRecipeId && typeof f.sourceRecipeId === 'object' && (f.sourceRecipeId as any).name
      ? (f.sourceRecipeId as any).name
      : undefined;

  // Build mixIns with ingredient names if populated
  const mixIns = (f.mixIns || []).map((m: any) => ({
    ingredient: typeof m.ingredient === 'object' && m.ingredient._id
      ? m.ingredient._id.toString()
      : m.ingredient.toString(),
    ingredientName: typeof m.ingredient === 'object' ? (m.ingredient as any).name : undefined,
    amountPerKg: m.amountPerKg,
  }));

  return {
    _id: (f._id as string).toString(),
    name: f.name,
    sourceRecipeId,
    sourceRecipeName,
    mixIns,
    iceCreamMixKg: recipeMixKg,
    overrunPercent: recipeOverrunPercent,
    totalFrozenLiters: totalFrozenL,
    totalLargeContainers: f.largeWarehouseContainers + f.largeParadetaContainers,
    totalLargeLiters: totalLargeL,
    totalSmallCount: totalSmall,
    largeWarehouseContainers: f.largeWarehouseContainers,
    largeWarehouseLiters: f.largeWarehouseLiters,
    largeParadetaContainers: f.largeParadetaContainers,
    largeParadetaLiters: f.largeParadetaLiters,
    smallWarehouseCount: f.smallWarehouseCount,
    smallParadetaCount: f.smallParadetaCount,
    essentialLarge: f.essentialLarge,
    essentialSmall: f.essentialSmall,
    paradetaTotalLiters: paradetaL,
    warehouseTotalLiters: warehouseL,
    alerts: { paradetaLow, overallLow },
  };
};

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/**
 * Create a new flavor variant linked to an existing recipe.
 * Requires sourceRecipeId — flavors must always belong to a recipe.
 */
export const createFlavor = async (
  input: CreateFlavorInput,
): Promise<IIceCreamFlavor> => {
  const trimmed = input.name.trim();
  if (!trimmed) {
    const err: any = new Error('Flavor name cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  if (!input.sourceRecipeId || !isValidObjectId(input.sourceRecipeId)) {
    const err: any = new Error('sourceRecipeId is required and must be a valid ObjectId.');
    err.statusCode = 400;
    throw err;
  }

  // Verify the recipe exists and is an ice cream recipe
  const recipe = await Recipe.findById(input.sourceRecipeId);
  if (!recipe) {
    const err: any = new Error('Referenced recipe not found.');
    err.statusCode = 404;
    throw err;
  }
  if (recipe.type !== 'ice cream recipe') {
    const err: any = new Error('Flavors can only be linked to ice cream recipes.');
    err.statusCode = 400;
    throw err;
  }

  // Check name uniqueness
  const existing = await IceCreamFlavor.findOne({
    name: { $regex: `^${trimmed}$`, $options: 'i' },
  });
  if (existing) {
    const err: any = new Error(`Flavor "${trimmed}" already exists.`);
    err.statusCode = 409;
    throw err;
  }

  const flavor = new IceCreamFlavor({
    name: trimmed,
    sourceRecipeId: new mongoose.Types.ObjectId(input.sourceRecipeId),
    mixIns: (input.mixIns || []).map(m => ({
      ingredient: new mongoose.Types.ObjectId(m.ingredient),
      amountPerKg: m.amountPerKg,
    })),
  });
  await flavor.save();
  return flavor;
};

export const getAllFlavors = async (): Promise<IIceCreamFlavor[]> => {
  return IceCreamFlavor.find().sort({ name: 1 });
};

export const getFlavorById = async (
  id: string,
): Promise<IIceCreamFlavor | null> => {
  if (!isValidObjectId(id)) return null;
  return IceCreamFlavor.findById(id).populate('mixIns.ingredient', 'name');
};

export const updateFlavor = async (
  id: string,
  updates: UpdateFlavorInput,
): Promise<IIceCreamFlavor | null> => {
  if (!isValidObjectId(id)) {
    const err: any = new Error('Invalid flavor ID format.');
    err.statusCode = 400;
    throw err;
  }

  const setFields: Record<string, any> = {};

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    const conflict = await IceCreamFlavor.findOne({
      _id: { $ne: new mongoose.Types.ObjectId(id) },
      name: { $regex: `^${trimmed}$`, $options: 'i' },
    });
    if (conflict) {
      const err: any = new Error(`Flavor "${trimmed}" already exists.`);
      err.statusCode = 409;
      throw err;
    }
    setFields.name = trimmed;
  }

  if (updates.essentialLarge !== undefined) {
    setFields.essentialLarge = updates.essentialLarge;
  }
  if (updates.essentialSmall !== undefined) {
    setFields.essentialSmall = updates.essentialSmall;
  }
  if (updates.mixIns !== undefined) {
    setFields.mixIns = updates.mixIns.map(m => ({
      ingredient: new mongoose.Types.ObjectId(m.ingredient),
      amountPerKg: m.amountPerKg,
    }));
  }

  const updated = await IceCreamFlavor.findByIdAndUpdate(id, { $set: setFields }, {
    new: true,
    runValidators: true,
  });

  // Bidirectional sync: if flavor name changed, update the linked recipe name
  // (only sync for the BASE flavor, not variant ones — but we don't know which is base here,
  //  so let the caller handle this; just update the recipe name unconditionally for now)
  if (updated && updates.name) {
    await Recipe.findByIdAndUpdate(
      updated.sourceRecipeId,
      { $set: { name: updates.name } },
    );
  }

  return updated;
};

export const deleteFlavor = async (
  id: string,
): Promise<IIceCreamFlavor | null> => {
  if (!isValidObjectId(id)) {
    throw new Error('Invalid flavor ID format.');
  }
  const deleted = await IceCreamFlavor.findByIdAndDelete(id);
  return deleted;
};

// ---------------------------------------------------------------------------
// Business operations
// ---------------------------------------------------------------------------

/**
 * Convert a batch of mix into frozen containers for a specific flavor variant.
 *
 * - Deducts `mixKg` from the parent Recipe's `iceCreamMixKg` (shared mix pool)
 * - Deducts the flavor's mix-in ingredients from stock (amountPerKg × mixKg / 1000)
 * - Creates containers on the flavor (all go to warehouse)
 * - Updates the recipe's cumulative overrun tracking
 */
export const convertMixToFrozen = async (
  flavorId: string,
  input: ConvertMixToFrozenInput,
): Promise<IIceCreamFlavor | null> => {
  if (!isValidObjectId(flavorId)) {
    const err: any = new Error('Invalid flavor ID format.');
    err.statusCode = 400;
    throw err;
  }

  const { mixKg, frozenLiters, largeContainers, smallContainers } = input;

  if (mixKg <= 0 || frozenLiters <= 0) {
    const err: any = new Error('mixKg and frozenLiters must be positive numbers.');
    err.statusCode = 400;
    throw err;
  }
  if (largeContainers < 0 || smallContainers < 0) {
    const err: any = new Error('Container counts cannot be negative.');
    err.statusCode = 400;
    throw err;
  }
  if (largeContainers === 0 && smallContainers === 0) {
    const err: any = new Error('At least one container must be specified.');
    err.statusCode = 400;
    throw err;
  }

  const smallLiters = smallContainers;
  const largeLiters = frozenLiters - smallLiters;

  if (largeContainers > 0 && largeLiters <= 0) {
    const err: any = new Error(
      'frozenLiters must be greater than the number of small containers to fill large containers.',
    );
    err.statusCode = 400;
    throw err;
  }

  // Look up the flavor (with mix-ins populated)
  const flavor = await IceCreamFlavor.findById(flavorId).populate('mixIns.ingredient', 'name');
  if (!flavor) {
    const err: any = new Error('Flavor not found.');
    err.statusCode = 404;
    throw err;
  }

  // Look up the parent recipe for mix pool
  if (!flavor.sourceRecipeId) {
    const err: any = new Error('This flavor is not linked to a recipe and cannot be used for conversion.');
    err.statusCode = 400;
    throw err;
  }

  const recipe = await Recipe.findById(flavor.sourceRecipeId);
  if (!recipe) {
    const err: any = new Error('Parent recipe not found.');
    err.statusCode = 404;
    throw err;
  }

  // Check mix availability on the recipe
  if (recipe.iceCreamMixKg < mixKg) {
    const err: any = new Error(
      `Not enough mix. Available: ${recipe.iceCreamMixKg.toFixed(2)} kg, requested: ${mixKg.toFixed(2)} kg.`,
    );
    err.statusCode = 400;
    throw err;
  }

  // --- Deduct mix from the recipe's shared pool ---
  recipe.iceCreamMixKg -= mixKg;
  recipe.totalMixConvertedKg += mixKg;
  recipe.totalFrozenProducedL += frozenLiters;
  await recipe.save();

  // --- Deduct mix-in ingredients from stock ---
  const mixInDeductions: Array<{ name: string; grams: number }> = [];
  for (const mixIn of flavor.mixIns || []) {
    const ingredientId = mixIn.ingredient.toString();
    // amountPerKg is grams per kg of mix
    const gramsToDeduct = mixIn.amountPerKg * mixKg;

    const ingName = typeof mixIn.ingredient === 'object' && (mixIn.ingredient as any).name
      ? (mixIn.ingredient as any).name
      : ingredientId;

    try {
      await updateIngredientStock(ingredientId, -gramsToDeduct);
      mixInDeductions.push({ name: ingName, grams: gramsToDeduct });
    } catch (err) {
      console.error(`Failed to deduct mix-in ingredient ${ingName} (${ingredientId}):`, err);
    }
  }

  if (mixInDeductions.length > 0) {
    console.log(
      `Mix-in deductions for "${flavor.name}" (${mixKg} kg mix):`,
      mixInDeductions.map(d => `${d.name}: ${d.grams.toFixed(1)}g`).join(', '),
    );
  }

  // --- Create containers on the flavor ---
  if (largeContainers > 0) {
    flavor.largeWarehouseContainers += largeContainers;
    flavor.largeWarehouseLiters += largeLiters;
  }
  flavor.smallWarehouseCount += smallContainers;

  await flavor.save();

  // --- Log the conversion event ---
  await eventService.logConversion(
    flavor,
    mixKg,
    frozenLiters,
    largeContainers,
    smallContainers,
    ((frozenLiters / mixKg) - 1) * 100,
  );

  return flavor;
};

/**
 * Sell (deduct) one container of a given type from a location.
 */
export const sellContainer = async (
  flavorId: string,
  input: SellContainerInput,
): Promise<IIceCreamFlavor | null> => {
  if (!isValidObjectId(flavorId)) {
    const err: any = new Error('Invalid flavor ID format.');
    err.statusCode = 400;
    throw err;
  }

  const flavor = await IceCreamFlavor.findById(flavorId);
  if (!flavor) {
    const err: any = new Error('Flavor not found.');
    err.statusCode = 404;
    throw err;
  }

  const { containerType, location } = input;

  if (containerType === 'large') {
    const containersField = location === 'warehouse' ? 'largeWarehouseContainers' : 'largeParadetaContainers';
    const litersField = location === 'warehouse' ? 'largeWarehouseLiters' : 'largeParadetaLiters';

    if (flavor[containersField] < 1) {
      const err: any = new Error(`No large containers available in ${location}.`);
      err.statusCode = 400;
      throw err;
    }

    const avgLiters = flavor[litersField] / flavor[containersField];
    flavor[containersField] -= 1;
    flavor[litersField] -= avgLiters;
    if (flavor[containersField] === 0) flavor[litersField] = 0;
  } else {
    const field = location === 'warehouse' ? 'smallWarehouseCount' : 'smallParadetaCount';
    if (flavor[field] < 1) {
      const err: any = new Error(`No small containers available in ${location}.`);
      err.statusCode = 400;
      throw err;
    }
    flavor[field] -= 1;
  }

  await flavor.save();
  await eventService.logSale(flavor, input.containerType, input.location);
  return flavor;
};

/**
 * Move containers from one location to the other.
 */
export const moveContainers = async (
  flavorId: string,
  input: MoveContainersInput,
): Promise<IIceCreamFlavor | null> => {
  if (!isValidObjectId(flavorId)) {
    const err: any = new Error('Invalid flavor ID format.');
    err.statusCode = 400;
    throw err;
  }
  if (input.from === input.to) {
    const err: any = new Error('Source and destination must differ.');
    err.statusCode = 400;
    throw err;
  }
  if (input.count <= 0) {
    const err: any = new Error('Count must be positive.');
    err.statusCode = 400;
    throw err;
  }

  const flavor = await IceCreamFlavor.findById(flavorId);
  if (!flavor) {
    const err: any = new Error('Flavor not found.');
    err.statusCode = 404;
    throw err;
  }

  const { containerType, count, from, to } = input;

  if (containerType === 'large') {
    const fromContainersField = from === 'warehouse' ? 'largeWarehouseContainers' : 'largeParadetaContainers';
    const fromLitersField = from === 'warehouse' ? 'largeWarehouseLiters' : 'largeParadetaLiters';
    const toContainersField = to === 'warehouse' ? 'largeWarehouseContainers' : 'largeParadetaContainers';
    const toLitersField = to === 'warehouse' ? 'largeWarehouseLiters' : 'largeParadetaLiters';

    if (flavor[fromContainersField] < count) {
      const err: any = new Error(`Not enough large containers in ${from}.`);
      err.statusCode = 400;
      throw err;
    }

    const avgLiters = flavor[fromContainersField] > 0 ? flavor[fromLitersField] / flavor[fromContainersField] : 0;
    const movedLiters = avgLiters * count;

    flavor[fromContainersField] -= count;
    flavor[fromLitersField] -= movedLiters;
    flavor[toContainersField] += count;
    flavor[toLitersField] += movedLiters;

    if (flavor[fromContainersField] === 0) flavor[fromLitersField] = 0;
  } else {
    const fromField = from === 'warehouse' ? 'smallWarehouseCount' : 'smallParadetaCount';
    const toField = to === 'warehouse' ? 'smallWarehouseCount' : 'smallParadetaCount';

    if (flavor[fromField] < count) {
      const err: any = new Error(`Not enough small containers in ${from}.`);
      err.statusCode = 400;
      throw err;
    }

    flavor[fromField] -= count;
    flavor[toField] += count;
  }

  await flavor.save();
  await eventService.logMovement(flavor, input.containerType, input.count, input.from, input.to);
  return flavor;
};

// ---------------------------------------------------------------------------
// Manual stock overrides & resets
// ---------------------------------------------------------------------------

/**
 * Directly set container stock values for a flavor (manual override).
 * Mix is on the Recipe, not on the Flavor — use setRecipeMixStock for that.
 */
export const setFlavorStock = async (
  id: string,
  data: {
    largeWarehouseContainers?: number;
    largeWarehouseLiters?: number;
    largeParadetaContainers?: number;
    largeParadetaLiters?: number;
    smallWarehouseCount?: number;
    smallParadetaCount?: number;
  },
): Promise<IIceCreamFlavor | null> => {
  if (!isValidObjectId(id)) {
    const err: any = new Error('Invalid flavor ID format.');
    err.statusCode = 400;
    throw err;
  }

  const allowedFields = [
    'largeWarehouseContainers',
    'largeWarehouseLiters',
    'largeParadetaContainers',
    'largeParadetaLiters',
    'smallWarehouseCount',
    'smallParadetaCount',
  ];

  const update: Record<string, number> = {};
  for (const field of allowedFields) {
    if (data[field as keyof typeof data] !== undefined) {
      const val = data[field as keyof typeof data] as number;
      if (typeof val !== 'number' || isNaN(val) || val < 0) {
        const err: any = new Error(`${field} must be a non-negative number.`);
        err.statusCode = 400;
        throw err;
      }
      update[field] = val;
    }
  }

  if (Object.keys(update).length === 0) {
    const err: any = new Error('No valid fields provided to update.');
    err.statusCode = 400;
    throw err;
  }

  const updated = await IceCreamFlavor.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  return updated;
};

/**
 * Reset iceCreamMixKg to 0 for all ice cream recipes (shared mix pool).
 */
export const resetAllMix = async (): Promise<number> => {
  const result = await Recipe.updateMany(
    { type: 'ice cream recipe' },
    { $set: { iceCreamMixKg: 0 } },
  );
  return result.modifiedCount;
};

/**
 * Reset all container fields to 0 for all flavors.
 */
export const resetAllContainers = async (): Promise<number> => {
  const result = await IceCreamFlavor.updateMany(
    {},
    {
      $set: {
        largeWarehouseContainers: 0,
        largeWarehouseLiters: 0,
        largeParadetaContainers: 0,
        largeParadetaLiters: 0,
        smallWarehouseCount: 0,
        smallParadetaCount: 0,
      },
    },
  );
  // Also reset recipe overrun tracking
  await Recipe.updateMany(
    { type: 'ice cream recipe' },
    { $set: { totalMixConvertedKg: 0, totalFrozenProducedL: 0 } },
  );
  return result.modifiedCount;
};

/**
 * Reset everything: containers on all flavors + mix on all ice cream recipes.
 */
export const resetAllFlavors = async (): Promise<number> => {
  const flavorResult = await IceCreamFlavor.updateMany(
    {},
    {
      $set: {
        largeWarehouseContainers: 0,
        largeWarehouseLiters: 0,
        largeParadetaContainers: 0,
        largeParadetaLiters: 0,
        smallWarehouseCount: 0,
        smallParadetaCount: 0,
      },
    },
  );
  // Reset recipe-level mix and overrun tracking
  await Recipe.updateMany(
    { type: 'ice cream recipe' },
    { $set: { iceCreamMixKg: 0, totalMixConvertedKg: 0, totalFrozenProducedL: 0 } },
  );
  return flavorResult.modifiedCount;
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const getDashboard = async (): Promise<DashboardFlavor[]> => {
  // 1. Fetch all flavors with populated sourceRecipeId and mixIn ingredients
  const flavors = await IceCreamFlavor.find()
    .populate('sourceRecipeId', 'name iceCreamMixKg totalMixConvertedKg totalFrozenProducedL')
    .populate('mixIns.ingredient', 'name')
    .sort({ name: 1 });

  // 2. Build a map of recipe ID → recipe mix data
  const recipeMap = new Map<string, { iceCreamMixKg: number; overrunPercent: number }>();
  for (const f of flavors) {
    const recipe = f.sourceRecipeId as any;
    if (recipe && recipe._id) {
      const rid = recipe._id.toString();
      if (!recipeMap.has(rid)) {
        const totalConv = recipe.totalMixConvertedKg || 0;
        const totalFroz = recipe.totalFrozenProducedL || 0;
        recipeMap.set(rid, {
          iceCreamMixKg: recipe.iceCreamMixKg || 0,
          overrunPercent: totalConv > 0 ? ((totalFroz / totalConv) - 1) * 100 : 0,
        });
      }
    }
  }

  // 3. Map each flavor to a dashboard item with recipe mix data
  return flavors.map(f => {
    const recipeData = f.sourceRecipeId
      ? recipeMap.get(
          (typeof f.sourceRecipeId === 'object' && (f.sourceRecipeId as any)._id
            ? (f.sourceRecipeId as any)._id.toString()
            : f.sourceRecipeId.toString()),
        )
      : undefined;

    return toDashboardItem(
      f,
      recipeData?.iceCreamMixKg ?? 0,
      recipeData?.overrunPercent ?? 0,
    );
  });
};
