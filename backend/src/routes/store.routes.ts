import { Router } from 'express';
import {
  createStore,
  getStores,
  getStore,
  updateStore,
} from '../controllers/store.controller.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getStores);
router.post('/', requireRole('ADMIN'), createStore);
router.get('/:id', getStore);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateStore);

export default router;
