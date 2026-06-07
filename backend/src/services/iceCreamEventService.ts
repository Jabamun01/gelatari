import IceCreamEvent from '../models/IceCreamEvent';
import { IIceCreamFlavor } from '../models/IceCreamFlavor';
import { Types } from 'mongoose';

/**
 * Build a snapshot from the current flavor state (container fields only).
 * Mix-level fields (iceCreamMixKg, overrun tracking) live on the Recipe.
 */
const buildSnapshot = (f: IIceCreamFlavor) => ({
  largeWarehouseContainers: f.largeWarehouseContainers,
  largeWarehouseLiters: f.largeWarehouseLiters,
  largeParadetaContainers: f.largeParadetaContainers,
  largeParadetaLiters: f.largeParadetaLiters,
  smallWarehouseCount: f.smallWarehouseCount,
  smallParadetaCount: f.smallParadetaCount,
});

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export const logProduction = async (
  flavor: IIceCreamFlavor,
  recipeId: string,
  recipeName: string,
  mixKgAdded: number,
) => {
  await IceCreamEvent.create({
    flavorId: new Types.ObjectId(flavor._id as string),
    flavorName: flavor.name,
    type: 'production',
    timestamp: new Date(),
    recipeId: new Types.ObjectId(recipeId),
    recipeName,
    mixKgAdded,
    snapshot: buildSnapshot(flavor),
  });
};

export const logConversion = async (
  flavor: IIceCreamFlavor,
  mixKgConverted: number,
  frozenLitersProduced: number,
  largeContainersAdded: number,
  smallContainersAdded: number,
  batchOverrunPercent: number,
) => {
  await IceCreamEvent.create({
    flavorId: new Types.ObjectId(flavor._id as string),
    flavorName: flavor.name,
    type: 'conversion',
    timestamp: new Date(),
    mixKgConverted,
    frozenLitersProduced,
    largeContainersAdded,
    smallContainersAdded,
    batchOverrunPercent,
    snapshot: buildSnapshot(flavor),
  });
};

export const logSale = async (
  flavor: IIceCreamFlavor,
  containerType: 'large' | 'small',
  location: 'warehouse' | 'paradeta',
) => {
  await IceCreamEvent.create({
    flavorId: new Types.ObjectId(flavor._id as string),
    flavorName: flavor.name,
    type: 'sale',
    timestamp: new Date(),
    soldContainerType: containerType,
    soldLocation: location,
    snapshot: buildSnapshot(flavor),
  });
};

export const logMovement = async (
  flavor: IIceCreamFlavor,
  containerType: 'large' | 'small',
  count: number,
  from: 'warehouse' | 'paradeta',
  to: 'warehouse' | 'paradeta',
) => {
  await IceCreamEvent.create({
    flavorId: new Types.ObjectId(flavor._id as string),
    flavorName: flavor.name,
    type: 'movement',
    timestamp: new Date(),
    movedContainerType: containerType,
    movedCount: count,
    movedFrom: from,
    movedTo: to,
    snapshot: buildSnapshot(flavor),
  });
};

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export interface EventQuery {
  flavorId?: string;
  type?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export const queryEvents = async (q: EventQuery) => {
  const filter: any = {};
  if (q.flavorId) {
    filter.flavorId = new Types.ObjectId(q.flavorId);
  }
  if (q.type) {
    filter.type = q.type;
  }
  if (q.fromDate || q.toDate) {
    filter.timestamp = {};
    if (q.fromDate) filter.timestamp.$gte = q.fromDate;
    if (q.toDate) filter.timestamp.$lte = q.toDate;
  }

  const limit = q.limit || 50;
  const offset = q.offset || 0;

  const [events, total] = await Promise.all([
    IceCreamEvent.find(filter)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    IceCreamEvent.countDocuments(filter),
  ]);

  return { events, total };
};
