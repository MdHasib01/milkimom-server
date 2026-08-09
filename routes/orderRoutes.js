import { Router } from 'express';
import {
  createOrder,
  createOrderAdmin,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  bulkDeleteOrders,
  checkOrderFraud,
} from '../controllers/orderController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: customers create orders and track a single order by id
router.post('/', createOrder);
router.get('/:id', getOrderById);

// Admin only: manual order entry (message-campaign sales), list,
// status & details updates, deletion
router.post('/admin', requireAdmin, createOrderAdmin);
router.get('/', requireAdmin, getOrders);
router.patch('/:id/status', requireAdmin, updateOrderStatus);
router.patch('/:id', requireAdmin, updateOrder);
router.post('/:id/check-fraud', requireAdmin, checkOrderFraud);
router.delete('/bulk', requireAdmin, bulkDeleteOrders);
router.delete('/:id', requireAdmin, deleteOrder);

export default router;
