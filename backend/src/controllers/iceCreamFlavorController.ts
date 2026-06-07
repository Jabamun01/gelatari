import { Request, Response } from 'express';
import * as iceCreamService from '../services/iceCreamFlavorService';
import * as eventService from '../services/iceCreamEventService';

// ---------------------------------------------------------------------------
// CRUD handlers
// ---------------------------------------------------------------------------

/**
 * Create a new flavor variant linked to an existing ice cream recipe.
 * Requires sourceRecipeId and optional mixIns.
 */
export const createFlavorHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, sourceRecipeId, mixIns } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ message: 'Flavor name is required.' });
      return;
    }
    if (!sourceRecipeId || typeof sourceRecipeId !== 'string') {
      res.status(400).json({ message: 'sourceRecipeId is required.' });
      return;
    }

    const flavor = await iceCreamService.createFlavor({
      name: name.trim(),
      sourceRecipeId,
      mixIns: mixIns || [],
    });
    res.status(201).json(flavor);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error('Error creating flavor:', error);
    res.status(500).json({ message: 'Failed to create flavor.' });
  }
};

export const getAllFlavorsHandler = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const flavors = await iceCreamService.getAllFlavors();
    res.status(200).json(flavors);
  } catch (error) {
    console.error('Error fetching flavors:', error);
    res.status(500).json({ message: 'Failed to fetch flavors.' });
  }
};

export const getFlavorByIdHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const flavor = await iceCreamService.getFlavorById(id);
    if (!flavor) {
      res.status(404).json({ message: 'Flavor not found.' });
      return;
    }
    res.status(200).json(flavor);
  } catch (error) {
    console.error('Error fetching flavor:', error);
    res.status(500).json({ message: 'Failed to fetch flavor.' });
  }
};

export const updateFlavorHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, essentialLarge, essentialSmall, mixIns } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (essentialLarge !== undefined) updates.essentialLarge = essentialLarge;
    if (essentialSmall !== undefined) updates.essentialSmall = essentialSmall;
    if (mixIns !== undefined) updates.mixIns = mixIns;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ message: 'No valid fields to update.' });
      return;
    }

    const flavor = await iceCreamService.updateFlavor(id, updates);
    if (!flavor) {
      res.status(404).json({ message: 'Flavor not found.' });
      return;
    }
    res.status(200).json(flavor);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error('Error updating flavor:', error);
    res.status(500).json({ message: 'Failed to update flavor.' });
  }
};

export const deleteFlavorHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await iceCreamService.deleteFlavor(id);
    if (!deleted) {
      res.status(404).json({ message: 'Flavor not found.' });
      return;
    }
    res.status(200).json({ message: 'Flavor deleted.', flavor: deleted });
  } catch (error: any) {
    console.error('Error deleting flavor:', error);
    res.status(500).json({ message: 'Failed to delete flavor.' });
  }
};

// ---------------------------------------------------------------------------
// Business-operation handlers
// ---------------------------------------------------------------------------

export const convertMixToFrozenHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { mixKg, frozenLiters, largeContainers, smallContainers } = req.body;

    if (
      typeof mixKg !== 'number' ||
      typeof frozenLiters !== 'number' ||
      typeof largeContainers !== 'number' ||
      typeof smallContainers !== 'number'
    ) {
      res.status(400).json({
        message:
          'mixKg, frozenLiters, largeContainers, and smallContainers are required numbers.',
      });
      return;
    }

    const flavor = await iceCreamService.convertMixToFrozen(id, {
      mixKg,
      frozenLiters,
      largeContainers,
      smallContainers,
    });

    if (!flavor) {
      res.status(404).json({ message: 'Flavor not found.' });
      return;
    }
    res.status(200).json(flavor);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error('Error converting mix to frozen:', error);
    res
      .status(500)
      .json({ message: 'Failed to convert mix to frozen.' });
  }
};

export const sellContainerHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { containerType, location } = req.body;

    if (
      !['large', 'small'].includes(containerType) ||
      !['warehouse', 'paradeta'].includes(location)
    ) {
      res.status(400).json({
        message:
          'containerType must be "large" or "small", location must be "warehouse" or "paradeta".',
      });
      return;
    }

    const flavor = await iceCreamService.sellContainer(id, {
      containerType,
      location,
    });
    if (!flavor) {
      res.status(404).json({ message: 'Flavor not found.' });
      return;
    }
    res.status(200).json(flavor);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error('Error selling container:', error);
    res.status(500).json({ message: 'Failed to sell container.' });
  }
};

export const moveContainersHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { containerType, count, from, to } = req.body;

    if (
      !['large', 'small'].includes(containerType) ||
      !['warehouse', 'paradeta'].includes(from) ||
      !['warehouse', 'paradeta'].includes(to) ||
      typeof count !== 'number' ||
      count <= 0
    ) {
      res.status(400).json({
        message:
          'containerType ("large"|"small"), count (>0), from and to ("warehouse"|"paradeta") are required.',
      });
      return;
    }

    const flavor = await iceCreamService.moveContainers(id, {
      containerType,
      count,
      from,
      to,
    });
    if (!flavor) {
      res.status(404).json({ message: 'Flavor not found.' });
      return;
    }
    res.status(200).json(flavor);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error('Error moving containers:', error);
    res.status(500).json({ message: 'Failed to move containers.' });
  }
};

// ---------------------------------------------------------------------------
// Manual stock override & reset handlers
// ---------------------------------------------------------------------------

export const setFlavorStockHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'largeWarehouseContainers',
      'largeWarehouseLiters',
      'largeParadetaContainers',
      'largeParadetaLiters',
      'smallWarehouseCount',
      'smallParadetaCount',
    ] as const;

    const data: Record<string, number> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({
        message:
          'No valid fields provided. Allowed: ' + allowedFields.join(', '),
      });
      return;
    }

    const flavor = await iceCreamService.setFlavorStock(id, data);
    if (!flavor) {
      res.status(404).json({ message: 'Flavor not found.' });
      return;
    }
    res.status(200).json(flavor);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error('Error setting flavor stock:', error);
    res.status(500).json({ message: 'Failed to set flavor stock.' });
  }
};

export const resetAllMixHandler = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const count = await iceCreamService.resetAllMix();
    res.status(200).json({
      message: 'All flavor mix reset to 0.',
      modifiedCount: count,
    });
  } catch (error) {
    console.error('Error resetting all mix:', error);
    res.status(500).json({ message: 'Failed to reset all mix.' });
  }
};

export const resetAllContainersHandler = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const count = await iceCreamService.resetAllContainers();
    res.status(200).json({
      message: 'All flavor containers reset to 0.',
      modifiedCount: count,
    });
  } catch (error) {
    console.error('Error resetting all containers:', error);
    res.status(500).json({ message: 'Failed to reset all containers.' });
  }
};

export const resetAllFlavorsHandler = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const count = await iceCreamService.resetAllFlavors();
    res.status(200).json({
      message: 'All flavor stock (mix + containers) reset to 0.',
      modifiedCount: count,
    });
  } catch (error) {
    console.error('Error resetting all flavors:', error);
    res.status(500).json({ message: 'Failed to reset all flavors.' });
  }
};

// ---------------------------------------------------------------------------
// Dashboard handler
// ---------------------------------------------------------------------------

export const getDashboardHandler = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const dashboard = await iceCreamService.getDashboard();
    res.status(200).json(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard.' });
  }
};

export const getEventsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      flavorId,
      type,
      fromDate,
      toDate,
      limit,
      offset,
    } = req.query;

    const result = await eventService.queryEvents({
      flavorId: typeof flavorId === 'string' ? flavorId : undefined,
      type: typeof type === 'string' ? type : undefined,
      fromDate: typeof fromDate === 'string' ? new Date(fromDate) : undefined,
      toDate: typeof toDate === 'string' ? new Date(toDate) : undefined,
      limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      offset: typeof offset === 'string' ? parseInt(offset, 10) : undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
};
