import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/orderController.js';

const router = Router();

router.route('/').post(createOrder).get(getOrders);
router.route('/:id').get(getOrderById).delete(deleteOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
