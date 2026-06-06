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
} from '../controllers/iceCreamFlavorController';

const router = Router();

// Dashboard – must be before /:id routes
router.get('/dashboard', getDashboardHandler as RequestHandler);

// CRUD
router.post('/', createFlavorHandler as RequestHandler);
router.get('/', getAllFlavorsHandler as RequestHandler);
router.get('/:id', getFlavorByIdHandler as RequestHandler);
router.put('/:id', updateFlavorHandler as RequestHandler);
router.delete('/:id', deleteFlavorHandler as RequestHandler);

// Events
router.get('/events', getEventsHandler as RequestHandler);

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

export default router;
