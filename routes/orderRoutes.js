import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  bulkDeleteOrders,
} from '../controllers/orderController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: customers create orders and track a single order by id
router.post('/', createOrder);
router.get('/:id', getOrderById);

// Admin only: list, status & details updates, deletion
router.get('/', requireAdmin, getOrders);
router.patch('/:id/status', requireAdmin, updateOrderStatus);
router.patch('/:id', requireAdmin, updateOrder);
router.delete('/bulk', requireAdmin, bulkDeleteOrders);
router.delete('/:id', requireAdmin, deleteOrder);

export default router;
