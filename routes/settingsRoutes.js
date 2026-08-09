import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  testSteadfastConnection,
  testIpinfoConnection,
  lookupIpLocation,
} from '../controllers/settingsController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);

router.route('/').get(getSettings).put(updateSettings);
router.post('/steadfast/test', testSteadfastConnection);
router.post('/ipinfo/test', testIpinfoConnection);
router.get('/ipinfo/lookup/:ip', lookupIpLocation);

export default router;
