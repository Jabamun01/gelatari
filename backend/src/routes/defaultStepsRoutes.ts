import { Router } from 'express';
import { getDefaultStepsHandler, createOrUpdateDefaultStepsHandler } from '../controllers/defaultStepsController';

const router = Router();

// Define default steps route
// GET /api/default-steps/:category
router.get('/:category', getDefaultStepsHandler);

// PUT /api/default-steps/:category
router.put('/:category', createOrUpdateDefaultStepsHandler);

export default router;
