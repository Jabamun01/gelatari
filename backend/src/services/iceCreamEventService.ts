import IceCreamEvent from '../models/IceCreamEvent';
import IceCreamFlavor from '../models/IceCreamFlavor';
import Recipe from '../models/Recipe';
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
// Public helpers (logging)
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

// ---------------------------------------------------------------------------
// Event update / delete with replay (Option C — full rebuild)
// ---------------------------------------------------------------------------

interface EventUpdateData {
  mixKgConverted?: number;
  frozenLitersProduced?: number;
  largeContainersAdded?: number;
  smallContainersAdded?: number;
}

/**
 * Update a conversion event and replay all subsequent events to rebuild state.
 *
 * The replay works by:
 * 1. Resetting the parent recipe's mix pool and cumulatives to 0
 * 2. Resetting ALL flavors under this recipe's container fields to 0
 * 3. Fetching ALL events across all flavors of this recipe, sorted chronologically
 * 4. Replaying each event in order (skipping the deleted one if applicable)
 * 5. Updating each event's snapshot to reflect the new state after that event
 */
export const updateEvent = async (
  eventId: string,
  updateData: EventUpdateData,
): Promise<any> => {
  if (!Types.ObjectId.isValid(eventId)) {
    const err: any = new Error('Invalid event ID format.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Find the event
  const event = await IceCreamEvent.findById(eventId);
  if (!event) {
    const err: any = new Error('Event not found.');
    err.statusCode = 404;
    throw err;
  }
  if (event.type !== 'conversion') {
    const err: any = new Error('Only conversion events can be edited.');
    err.statusCode = 400;
    throw err;
  }

  // 2. Apply the update
  if (updateData.mixKgConverted !== undefined) {
    event.mixKgConverted = updateData.mixKgConverted;
  }
  if (updateData.frozenLitersProduced !== undefined) {
    event.frozenLitersProduced = updateData.frozenLitersProduced;
  }
  if (updateData.largeContainersAdded !== undefined) {
    event.largeContainersAdded = updateData.largeContainersAdded;
  }
  if (updateData.smallContainersAdded !== undefined) {
    event.smallContainersAdded = updateData.smallContainersAdded;
  }

  // Re-compute batch overrun
  if (
    event.mixKgConverted !== undefined &&
    event.frozenLitersProduced !== undefined &&
    event.mixKgConverted > 0
  ) {
    event.batchOverrunPercent =
      ((event.frozenLitersProduced / event.mixKgConverted) - 1) * 100;
  }

  // Update the timestamp to now (so it's re-ordered correctly in replay)
  event.timestamp = new Date();

  // 3. Find the flavor and recipe
  const flavor = await IceCreamFlavor.findById(event.flavorId);
  if (!flavor) {
    const err: any = new Error('Flavor not found for this event.');
    err.statusCode = 404;
    throw err;
  }
  if (!flavor.sourceRecipeId) {
    const err: any = new Error('Flavor has no source recipe.');
    err.statusCode = 400;
    throw err;
  }

  const recipeId = flavor.sourceRecipeId.toString();

  // 4. Do the full replay
  await replayAllEventsForRecipe(recipeId, eventId, undefined);

  // 5. Return the updated event
  const refreshed = await IceCreamEvent.findById(eventId).lean();
  return refreshed;
};

/**
 * Delete a conversion event and replay all remaining events to rebuild state.
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  if (!Types.ObjectId.isValid(eventId)) {
    const err: any = new Error('Invalid event ID format.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Find the event
  const event = await IceCreamEvent.findById(eventId);
  if (!event) {
    const err: any = new Error('Event not found.');
    err.statusCode = 404;
    throw err;
  }
  if (event.type !== 'conversion') {
    const err: any = new Error('Only conversion events can be deleted.');
    err.statusCode = 400;
    throw err;
  }

  // 2. Find the flavor and recipe
  const flavor = await IceCreamFlavor.findById(event.flavorId);
  if (!flavor) {
    // Flavor might already be deleted — that's OK, just delete the event
    await IceCreamEvent.findByIdAndDelete(eventId);
    return;
  }
  if (!flavor.sourceRecipeId) {
    // No source recipe — just delete the event
    await IceCreamEvent.findByIdAndDelete(eventId);
    return;
  }

  const recipeId = flavor.sourceRecipeId.toString();

  // 3. Delete the event document
  await IceCreamEvent.findByIdAndDelete(eventId);

  // 4. Replay all remaining events
  await replayAllEventsForRecipe(recipeId, undefined, eventId);
};

// ---------------------------------------------------------------------------
// Replay engine
// ---------------------------------------------------------------------------

/**
 * Full replay for a given recipe.
 *
 * - Resets the recipe's mix pool and cumulatives
 * - Resets ALL flavors' container fields to 0
 * - Fetches ALL events across ALL flavors of this recipe (production, conversion,
 *   sale, movement), sorted chronologically
 * - Replays each event, applying its effect and updating its snapshot
 *
 * @param recipeId - The recipe to replay events for
 * @param updatedEventId - If set, this event has been updated and should use new values
 * @param deletedEventId - If set, skip this event entirely
 */
async function replayAllEventsForRecipe(
  recipeId: string,
  updatedEventId?: string,
  deletedEventId?: string,
): Promise<void> {
  // 1. Reset recipe
  await Recipe.findByIdAndUpdate(recipeId, {
    $set: {
      iceCreamMixKg: 0,
      totalMixConvertedKg: 0,
      totalFrozenProducedL: 0,
    },
  });
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) return;

  // 2. Reset ALL flavors under this recipe
  const allFlavors = await IceCreamFlavor.find({
    sourceRecipeId: new Types.ObjectId(recipeId),
  });
  for (const f of allFlavors) {
    f.largeWarehouseContainers = 0;
    f.largeWarehouseLiters = 0;
    f.largeParadetaContainers = 0;
    f.largeParadetaLiters = 0;
    f.smallWarehouseCount = 0;
    f.smallParadetaCount = 0;
  }
  const flavorMap = new Map<string, IIceCreamFlavor>();
  for (const f of allFlavors) {
    flavorMap.set((f._id as string).toString(), f);
  }

  // 3. Get ALL events for all flavors of this recipe
  // We need production events (on base flavor) and all other events on all flavors
  const flavorIds = allFlavors.map(f => f._id);

  const allEvents = await IceCreamEvent.find({
    flavorId: { $in: flavorIds },
  })
    .sort({ timestamp: 1 }) // ascending chronological order
    .exec();

  // 4. Replay
  for (const evt of allEvents) {
    const evtId = (evt._id as string).toString();

    // Skip if this event was deleted
    if (deletedEventId && evtId === deletedEventId) {
      continue;
    }

    const isUpdated = updatedEventId && evtId === updatedEventId;

    const f = flavorMap.get(evt.flavorId.toString());
    if (!f) continue; // flavor gone, skip

    switch (evt.type) {
      case 'production': {
        // Add mix to the recipe pool
        const mixKg = isUpdated ? (evt.mixKgAdded ?? 0) : (evt.mixKgAdded ?? 0);
        recipe.iceCreamMixKg += mixKg;

        // Update the event's snapshot (unchanged for production events)
        evt.snapshot = buildSnapshot(f);
        break;
      }

      case 'conversion': {
        const mixKgConverted = isUpdated
          ? (evt.mixKgConverted ?? 0)
          : (evt.mixKgConverted ?? 0);
        const frozenLiters = isUpdated
          ? (evt.frozenLitersProduced ?? 0)
          : (evt.frozenLitersProduced ?? 0);
        const largeAdded = isUpdated
          ? (evt.largeContainersAdded ?? 0)
          : (evt.largeContainersAdded ?? 0);
        const smallAdded = isUpdated
          ? (evt.smallContainersAdded ?? 0)
          : (evt.smallContainersAdded ?? 0);

        // Check mix availability
        if (recipe.iceCreamMixKg < mixKgConverted) {
          console.warn(
            `[replay] Not enough mix for conversion event ${evtId}: ` +
            `have ${recipe.iceCreamMixKg.toFixed(2)} kg, need ${mixKgConverted.toFixed(2)} kg. ` +
            `Skipping (will proceed with 0 effect).`,
          );
          evt.snapshot = buildSnapshot(f);
          continue;
        }

        // Deduct mix from recipe
        recipe.iceCreamMixKg -= mixKgConverted;
        recipe.totalMixConvertedKg += mixKgConverted;
        recipe.totalFrozenProducedL += frozenLiters;

        // Add containers to flavor
        if (largeAdded > 0) {
          const avgPerContainer =
            largeAdded > 0 ? frozenLiters - smallAdded : 0;
          const avgLitersPerContainer =
            largeAdded > 0 ? avgPerContainer / largeAdded : 0;
          // Distribute the large liters proportionally
          const largeLiters = avgPerContainer;
          f.largeWarehouseContainers += largeAdded;
          f.largeWarehouseLiters += largeLiters;
        }
        f.smallWarehouseCount += smallAdded;

        // Update event snapshot
        evt.snapshot = buildSnapshot(f);
        break;
      }

      case 'sale': {
        const ctype = evt.soldContainerType;
        const loc = evt.soldLocation;

        if (ctype === 'large') {
          if (loc === 'warehouse') {
            if (f.largeWarehouseContainers > 0) {
              const avg =
                f.largeWarehouseLiters / f.largeWarehouseContainers;
              f.largeWarehouseContainers -= 1;
              f.largeWarehouseLiters -= avg;
              if (f.largeWarehouseContainers <= 0) f.largeWarehouseLiters = 0;
            }
          } else {
            if (f.largeParadetaContainers > 0) {
              const avg =
                f.largeParadetaLiters / f.largeParadetaContainers;
              f.largeParadetaContainers -= 1;
              f.largeParadetaLiters -= avg;
              if (f.largeParadetaContainers <= 0) f.largeParadetaLiters = 0;
            }
          }
        } else {
          if (loc === 'warehouse') {
            if (f.smallWarehouseCount > 0) f.smallWarehouseCount -= 1;
          } else {
            if (f.smallParadetaCount > 0) f.smallParadetaCount -= 1;
          }
        }

        evt.snapshot = buildSnapshot(f);
        break;
      }

      case 'movement': {
        const mtype = evt.movedContainerType;
        const count = evt.movedCount ?? 1;
        const from = evt.movedFrom;
        const to = evt.movedTo;

        if (mtype === 'large') {
          const fromContField =
            from === 'warehouse'
              ? 'largeWarehouseContainers'
              : 'largeParadetaContainers';
          const fromLitField =
            from === 'warehouse'
              ? 'largeWarehouseLiters'
              : 'largeParadetaLiters';
          const toContField =
            to === 'warehouse'
              ? 'largeWarehouseContainers'
              : 'largeParadetaContainers';
          const toLitField =
            to === 'warehouse'
              ? 'largeWarehouseLiters'
              : 'largeParadetaLiters';

          if ((f[fromContField] ?? 0) >= count) {
            const avg =
              (f[fromContField] ?? 0) > 0
                ? (f[fromLitField] ?? 0) / (f[fromContField] ?? 1)
                : 0;
            const movedLiters = avg * count;

            f[fromContField] = (f[fromContField] ?? 0) - count;
            f[fromLitField] = (f[fromLitField] ?? 0) - movedLiters;
            f[toContField] = (f[toContField] ?? 0) + count;
            f[toLitField] = (f[toLitField] ?? 0) + movedLiters;

            if ((f[fromContField] ?? 0) <= 0) f[fromLitField] = 0;
          }
        } else {
          const fromField =
            from === 'warehouse'
              ? 'smallWarehouseCount'
              : 'smallParadetaCount';
          const toField =
            to === 'warehouse'
              ? 'smallWarehouseCount'
              : 'smallParadetaCount';

          if ((f[fromField] ?? 0) >= count) {
            f[fromField] = (f[fromField] ?? 0) - count;
            f[toField] = (f[toField] ?? 0) + count;
          }
        }

        evt.snapshot = buildSnapshot(f);
        break;
      }
    }
  }

  // 5. Save everything
  await recipe.save();

  const savePromises: Promise<any>[] = [];
  for (const f of flavorMap.values()) {
    savePromises.push(f.save());
  }
  for (const evt of allEvents) {
    // Don't save the deleted event
    if (deletedEventId && (evt._id as string).toString() === deletedEventId) {
      continue;
    }
    savePromises.push(evt.save());
  }

  await Promise.all(savePromises);
}
