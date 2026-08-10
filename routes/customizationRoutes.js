import { Router } from 'express';
import {
  getPublicTheme,
  getAdminThemes,
  updateAdminTheme,
  resetAdminTheme,
  createAdminTheme,
} from '../controllers/customizationController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes (no admin auth required)
router.get('/public', getPublicTheme);
router.get('/public/:slug', getPublicTheme);

// Protected Admin routes
router.get('/admin', requireAdmin, getAdminThemes);
router.post('/admin', requireAdmin, createAdminTheme);
router.put('/admin/:slug', requireAdmin, updateAdminTheme);
router.post('/admin/:slug/reset', requireAdmin, resetAdminTheme);

export default router;
