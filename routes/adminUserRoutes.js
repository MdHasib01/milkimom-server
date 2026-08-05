import { Router } from 'express';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
} from '../controllers/adminUserController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);

router.route('/').get(getAdminUsers).post(createAdminUser);
router.post('/:id/reset-password', resetAdminUserPassword);
router.route('/:id').patch(updateAdminUser).delete(deleteAdminUser);

export default router;
