import express from 'express';
import {
  getMotherCount,
  updateMotherCount,
  getMilkreadyCount,
  updateMilkreadyCount,
} from '../controllers/statsController.js';

const router = express.Router();

router.get('/mother-count', getMotherCount);
router.put('/mother-count', updateMotherCount);

router.get('/milkready-count', getMilkreadyCount);
router.put('/milkready-count', updateMilkreadyCount);

export default router;
