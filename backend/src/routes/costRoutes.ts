import { Router, RequestHandler } from 'express';
import { getFlavorCostsHandler } from '../controllers/costController';

const router = Router();

router.get('/flavors', getFlavorCostsHandler as RequestHandler);

export default router;
