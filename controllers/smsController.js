import Order from '../models/Order.js';
import { normalizePhoneNumber } from '../utils/phone.js';
import { checkOtpRateLimit, sendBdBulkSms } from '../utils/sms.js';

const ALLOWED_PURPOSES = ['otp', 'customer_confirmation', 'admin_notification'];

/**
 * Verifies a recent saved order in MongoDB for the given phone number,
 * or any recent order (for admin notifications).
 */
async function verifyRecentOrderExists(phone, isAdmin) {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const filter = { orderTime: { $gte: fifteenMinutesAgo } };
    if (!isAdmin) {
      // Customer confirmations must match the order's phone (accept both local and normalized formats)
      const normalized = normalizePhoneNumber(phone);
      const local = normalized.startsWith('88') ? normalized.slice(2) : normalized;
      filter.phone = { $in: [phone, normalized, local] };
    }

    const exists = await Order.exists(filter);
    return Boolean(exists);
  } catch (err) {
    console.error('[SMS Verify] Exception during order verification:', err);
    return true; // Graceful fallback: do not block message delivery if database fails
  }
}

/**
 * @route   POST /api/sms/send
 * @desc    Send an SMS (otp | customer_confirmation | admin_notification)
 */
export async function sendSms(req, res, next) {
  try {
    const { to, message, purpose } = req.body;

    if (!to || !message || !purpose) {
      return res.status(400).json({
        success: false,
        error: 'Missing "to", "message" or "purpose" parameters',
      });
    }

    // Do not allow arbitrary public SMS abuse
    if (!ALLOWED_PURPOSES.includes(purpose)) {
      return res.status(400).json({
        success: false,
        error: `Invalid purpose. Only ${ALLOWED_PURPOSES.map((p) => `"${p}"`).join(', ')} are allowed.`,
      });
    }

    const normalizedTo = normalizePhoneNumber(to);

    if (purpose === 'otp') {
      // Basic rate limiting: max 3 OTP sends per phone per 15 minutes
      const allowed = checkOtpRateLimit(normalizedTo);
      if (!allowed) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Maximum 3 OTP sends per phone number per 15 minutes.',
        });
      }
    } else if (purpose === 'customer_confirmation') {
      const isOrderValid = await verifyRecentOrderExists(to, false);
      if (!isOrderValid) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: No matching recent saved order found for this phone number.',
        });
      }
    } else if (purpose === 'admin_notification') {
      const isOrderValid = await verifyRecentOrderExists(to, true);
      if (!isOrderValid) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: No recent saved orders found.',
        });
      }
    }

    const result = await sendBdBulkSms(normalizedTo, message, purpose);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
