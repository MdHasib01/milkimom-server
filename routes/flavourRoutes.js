import { Router } from 'express';
import {
  getFlavours,
  getFlavoursAdmin,
  createFlavour,
  updateFlavour,
  deleteFlavour,
} from '../controllers/flavourController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: the website order section reads the catalog
router.get('/', getFlavours);

// Admin: catalog management
router.get('/admin', requireAdmin, getFlavoursAdmin);
router.post('/', requireAdmin, createFlavour);
router.patch('/:id', requireAdmin, updateFlavour);
router.delete('/:id', requireAdmin, deleteFlavour);

export default router;
