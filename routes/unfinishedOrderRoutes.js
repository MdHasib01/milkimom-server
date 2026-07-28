import { Router } from 'express';
import {
  saveUnfinishedOrder,
  getUnfinishedOrders,
  updateUnfinishedOrderStatus,
  deleteUnfinishedOrder,
  bulkDeleteUnfinishedOrders,
} from '../controllers/unfinishedOrderController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public endpoint: save incomplete order attempt when customer fills form / checks phone
router.post('/save', saveUnfinishedOrder);

// Protected admin endpoints
router.get('/', requireAdmin, getUnfinishedOrders);
router.patch('/:id/status', requireAdmin, updateUnfinishedOrderStatus);
router.delete('/:id', requireAdmin, deleteUnfinishedOrder);
router.post('/bulk-delete', requireAdmin, bulkDeleteUnfinishedOrders);

export default router;
