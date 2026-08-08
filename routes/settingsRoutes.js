import { Router } from 'express';
import { getSettings, updateSettings, testSteadfastConnection } from '../controllers/settingsController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);

router.route('/').get(getSettings).put(updateSettings);
router.post('/steadfast/test', testSteadfastConnection);

export default router;
