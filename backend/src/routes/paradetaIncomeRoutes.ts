import { Router } from 'express';
import {
  list,
  stats,
  groupedStats,
  exportData,
  getById,
  create,
  update,
  remove,
} from '../controllers/paradetaIncomeController';

const router = Router();

// These must come before /:id so they aren't shadowed
router.get('/stats', stats);
router.get('/grouped-stats', groupedStats);
router.get('/export', exportData);

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
