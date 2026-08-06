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

// Block moderators from user management
router.use((req, res, next) => {
  if (req.admin && req.admin.role === 'moderator') {
    return res.status(403).json({ success: false, error: 'Moderators are not permitted to access user management' });
  }
  next();
});

router.route('/').get(getAdminUsers).post(createAdminUser);
router.post('/:id/reset-password', resetAdminUserPassword);
router.route('/:id').patch(updateAdminUser).delete(deleteAdminUser);

export default router;

