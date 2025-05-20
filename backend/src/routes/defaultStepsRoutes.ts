import { Router } from 'express';
import asyncHandler from 'express-async-handler'; // Import asyncHandler for consistency
import { getDefaultStepsHandler, createOrUpdateDefaultStepsHandler } from '../controllers/defaultStepsController';

const router = Router();

// Define default steps route
// GET /api/default-steps/:category
router.get('/:category', asyncHandler(getDefaultStepsHandler));

// PUT /api/default-steps/:category
router.put('/:category', asyncHandler(createOrUpdateDefaultStepsHandler));

export default router;