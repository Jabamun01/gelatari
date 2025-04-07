import { Router } from 'express';
import asyncHandler from 'express-async-handler'; // Import asyncHandler for consistency
import { getDefaultStepsHandler } from '../controllers/defaultStepsController';

const router = Router();

// Define default steps route
// GET /api/default-steps/:category
router.get('/:category', asyncHandler(getDefaultStepsHandler));

export default router;