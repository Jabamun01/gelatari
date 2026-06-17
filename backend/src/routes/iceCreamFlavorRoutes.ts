import { Router, RequestHandler } from 'express';
import {
  createFlavorHandler,
  getAllFlavorsHandler,
  getFlavorByIdHandler,
  updateFlavorHandler,
  deleteFlavorHandler,
  convertMixToFrozenHandler,
  sellContainerHandler,
  moveContainersHandler,
  getDashboardHandler,
  getEventsHandler,
  setFlavorStockHandler,
  resetAllMixHandler,
  resetAllContainersHandler,
  resetAllFlavorsHandler,
  updateEventHandler,
  deleteEventHandler,
} from '../controllers/iceCreamFlavorController';

const router = Router();

// Dashboard – must be before /:id routes
router.get('/dashboard', getDashboardHandler as RequestHandler);

// Events (must be before /:id routes to avoid shadowing)
router.get('/events', getEventsHandler as RequestHandler);
router.put('/events/:id', updateEventHandler as RequestHandler);
router.delete('/events/:id', deleteEventHandler as RequestHandler);

// CRUD
router.post('/', createFlavorHandler as RequestHandler);
router.get('/', getAllFlavorsHandler as RequestHandler);
router.get('/:id', getFlavorByIdHandler as RequestHandler);
router.put('/:id', updateFlavorHandler as RequestHandler);
router.delete('/:id', deleteFlavorHandler as RequestHandler);

// Business operations
router.patch(
  '/:id/convert-mix',
  convertMixToFrozenHandler as RequestHandler,
);
router.patch(
  '/:id/sell-container',
  sellContainerHandler as RequestHandler,
);
router.patch(
  '/:id/move-containers',
  moveContainersHandler as RequestHandler,
);

// Manual stock overrides & resets (must be before /:id catches)
router.patch(
  '/:id/set-stock',
  setFlavorStockHandler as RequestHandler,
);
router.post(
  '/reset-mix',
  resetAllMixHandler as RequestHandler,
);
router.post(
  '/reset-containers',
  resetAllContainersHandler as RequestHandler,
);
router.post(
  '/reset-all',
  resetAllFlavorsHandler as RequestHandler,
);

export default router;
