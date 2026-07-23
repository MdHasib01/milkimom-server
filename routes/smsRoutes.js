import { Router } from 'express';
import { sendSms } from '../controllers/smsController.js';

const router = Router();

router.post('/send', sendSms);

export default router;
