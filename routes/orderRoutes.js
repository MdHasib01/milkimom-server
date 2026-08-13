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
  patchOrderAttribution,
} from '../controllers/orderController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: customers create orders and track a single order by id.
// The attribution patch is public too but fill-only and time-boxed — it lets
// the thank-you page add tracking ids (notably _fbp) that the browser had not
// written yet when the order was posted. See patchOrderAttribution.
router.post('/', createOrder);
router.patch('/:id/attribution', patchOrderAttribution);
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
