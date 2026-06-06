import IceCreamFlavor, { IIceCreamFlavor } from '../models/IceCreamFlavor';
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

export interface DashboardFlavor {
  _id: string;
  name: string;
  iceCreamMixKg: number;
  overrunPercent: number;
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
const PARADETA_LOW_THRESHOLD_LARGE_L = 15;  // < 15 L in paradeta = low
const PARADETA_LOW_THRESHOLD_SMALL_COUNT = 5; // < 5 small in paradeta = low
const OVERALL_LOW_THRESHOLD_LARGE_L = 25;     // < 25 L total large = overall low
const OVERALL_LOW_THRESHOLD_SMALL_COUNT = 10;  // < 10 small total = overall low

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether a string is a valid MongoDB ObjectId.
 */
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

/**
 * Build a typed dashboard item from a flavor document.
 */
const toDashboardItem = (f: IIceCreamFlavor): DashboardFlavor => {
  const totalLargeL = f.largeWarehouseLiters + f.largeParadetaLiters;
  const totalSmall = f.smallWarehouseCount + f.smallParadetaCount;
  const paradetaL =
    f.largeParadetaLiters + f.smallParadetaCount; // small = 1 L each
  const warehouseL =
    f.largeWarehouseLiters + f.smallWarehouseCount;
  const totalFrozenL = totalLargeL + totalSmall;

  // Alert logic – only applies when the flavor is essential for that container type
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

  return {
    _id: (f._id as string).toString(),
    name: f.name,
    iceCreamMixKg: f.iceCreamMixKg,
    overrunPercent:
      f.totalMixConvertedKg > 0
        ? ((f.totalFrozenProducedL / f.totalMixConvertedKg) - 1) * 100
        : 0,
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

export const createFlavor = async (
  name: string,
): Promise<IIceCreamFlavor> => {
  const trimmed = name.trim();
  if (!trimmed) {
    const err: any = new Error('Flavor name cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  const existing = await IceCreamFlavor.findOne({
    name: { $regex: `^${trimmed}$`, $options: 'i' },
  });
  if (existing) {
    const err: any = new Error(`Flavor "${trimmed}" already exists.`);
    err.statusCode = 409;
    throw err;
  }

  const flavor = new IceCreamFlavor({ name: trimmed });
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
  return IceCreamFlavor.findById(id);
};

export const updateFlavor = async (
  id: string,
  updates: {
    name?: string;
    essentialLarge?: boolean;
    essentialSmall?: boolean;
  },
): Promise<IIceCreamFlavor | null> => {
  if (!isValidObjectId(id)) {
    const err: any = new Error('Invalid flavor ID format.');
    err.statusCode = 400;
    throw err;
  }

  // If renaming, check uniqueness
  if (updates.name) {
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
    updates.name = trimmed;
  }

  const updated = await IceCreamFlavor.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
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
 * Convert a batch of mix into frozen containers.
 *
 * - Deducts `mixKg` from `iceCreamMixKg`
 * - Adds `frozenLiters` to cumulative overrun tracking
 * - Creates containers (all go to warehouse)
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
    const err: any = new Error(
      'mixKg and frozenLiters must be positive numbers.',
    );
    err.statusCode = 400;
    throw err;
  }
  if (largeContainers < 0 || smallContainers < 0) {
    const err: any = new Error('Container counts cannot be negative.');
    err.statusCode = 400;
    throw err;
  }
  if (largeContainers === 0 && smallContainers === 0) {
    const err: any = new Error(
      'At least one container must be specified.',
    );
    err.statusCode = 400;
    throw err;
  }

  // Compute liters assigned to large vs small containers
  // Small containers are exactly 1 L each
  const smallLiters = smallContainers;
  const largeLiters = frozenLiters - smallLiters;

  if (largeContainers > 0 && largeLiters <= 0) {
    const err: any = new Error(
      'frozenLiters must be greater than the number of small containers to fill large containers.',
    );
    err.statusCode = 400;
    throw err;
  }

  const flavor = await IceCreamFlavor.findById(flavorId);
  if (!flavor) {
    const err: any = new Error('Flavor not found.');
    err.statusCode = 404;
    throw err;
  }

  if (flavor.iceCreamMixKg < mixKg) {
    const err: any = new Error(
      `Not enough mix. Available: ${flavor.iceCreamMixKg.toFixed(2)} kg, requested: ${mixKg.toFixed(2)} kg.`,
    );
    err.statusCode = 400;
    throw err;
  }

  // Update mix
  flavor.iceCreamMixKg -= mixKg;

  // Update overrun tracking
  flavor.totalMixConvertedKg += mixKg;
  flavor.totalFrozenProducedL += frozenLiters;

  // Update large containers (go to warehouse by default)
  if (largeContainers > 0) {
    const avgPerContainer = largeLiters / largeContainers;

    // Merge: add to existing totals (averaging happens implicitly)
    flavor.largeWarehouseContainers += largeContainers;
    flavor.largeWarehouseLiters += largeLiters;
  }

  // Update small containers
  flavor.smallWarehouseCount += smallContainers;

  await flavor.save();

  // Log the conversion event
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
 * For large containers, deducts the current average size.
 * For small containers, deducts exactly 1 L.
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
    const containersField =
      location === 'warehouse'
        ? 'largeWarehouseContainers'
        : 'largeParadetaContainers';
    const litersField =
      location === 'warehouse'
        ? 'largeWarehouseLiters'
        : 'largeParadetaLiters';

    if (flavor[containersField] < 1) {
      const err: any = new Error(
        `No large containers available in ${location}.`,
      );
      err.statusCode = 400;
      throw err;
    }

    // Calculate current average size for this location
    const avgLiters = flavor[litersField] / flavor[containersField];

    flavor[containersField] -= 1;
    flavor[litersField] -= avgLiters;

    // Clean up floating-point drift
    if (flavor[containersField] === 0) flavor[litersField] = 0;
  } else {
    // small
    const field =
      location === 'warehouse'
        ? 'smallWarehouseCount'
        : 'smallParadetaCount';

    if (flavor[field] < 1) {
      const err: any = new Error(
        `No small containers available in ${location}.`,
      );
      err.statusCode = 400;
      throw err;
    }

    flavor[field] -= 1;
  }

  await flavor.save();

  // Log the sale event
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
    const fromContainersField =
      from === 'warehouse'
        ? 'largeWarehouseContainers'
        : 'largeParadetaContainers';
    const fromLitersField =
      from === 'warehouse'
        ? 'largeWarehouseLiters'
        : 'largeParadetaLiters';
    const toContainersField =
      to === 'warehouse'
        ? 'largeWarehouseContainers'
        : 'largeParadetaContainers';
    const toLitersField =
      to === 'warehouse'
        ? 'largeWarehouseLiters'
        : 'largeParadetaLiters';

    if (flavor[fromContainersField] < count) {
      const err: any = new Error(
        `Not enough large containers in ${from}. Available: ${flavor[fromContainersField]}, requested: ${count}.`,
      );
      err.statusCode = 400;
      throw err;
    }

    // Average size from the source location
    const avgLiters =
      flavor[fromContainersField] > 0
        ? flavor[fromLitersField] / flavor[fromContainersField]
        : 0;
    const movedLiters = avgLiters * count;

    flavor[fromContainersField] -= count;
    flavor[fromLitersField] -= movedLiters;
    flavor[toContainersField] += count;
    flavor[toLitersField] += movedLiters;

    // Clean up floating-point drift
    if (flavor[fromContainersField] === 0) flavor[fromLitersField] = 0;
  } else {
    // small
    const fromField =
      from === 'warehouse'
        ? 'smallWarehouseCount'
        : 'smallParadetaCount';
    const toField =
      to === 'warehouse'
        ? 'smallWarehouseCount'
        : 'smallParadetaCount';

    if (flavor[fromField] < count) {
      const err: any = new Error(
        `Not enough small containers in ${from}. Available: ${flavor[fromField]}, requested: ${count}.`,
      );
      err.statusCode = 400;
      throw err;
    }

    flavor[fromField] -= count;
    flavor[toField] += count;
  }

  await flavor.save();

  // Log the movement event
  await eventService.logMovement(
    flavor,
    input.containerType,
    input.count,
    input.from,
    input.to,
  );

  return flavor;
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const getDashboard = async (): Promise<DashboardFlavor[]> => {
  const flavors = await IceCreamFlavor.find().sort({ name: 1 });
  return flavors.map(toDashboardItem);
};
