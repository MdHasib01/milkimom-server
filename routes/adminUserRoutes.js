import { Router } from 'express';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../controllers/adminUserController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);

router.route('/').get(getAdminUsers).post(createAdminUser);
router.route('/:id').patch(updateAdminUser).delete(deleteAdminUser);

export default router;
