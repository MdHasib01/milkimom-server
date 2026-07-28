import { Router } from 'express';
import { checkIpAndFraud, sendOtp, verifyOtp } from '../controllers/fraudController.js';

const router = Router();

router.post('/check-ip', checkIpAndFraud);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

export default router;
