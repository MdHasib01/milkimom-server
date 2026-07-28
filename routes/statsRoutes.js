import express from 'express';
import {
  getMotherCount,
  updateMotherCount,
} from '../controllers/statsController.js';

const router = express.Router();

router.get('/mother-count', getMotherCount);
router.put('/mother-count', updateMotherCount);

export default router;
