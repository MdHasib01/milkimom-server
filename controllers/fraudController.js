import IpTrack from '../models/IpTrack.js';
import OtpToken from '../models/OtpToken.js';
import Order from '../models/Order.js';
import UnfinishedOrder from '../models/UnfinishedOrder.js';
import { normalizePhoneNumber, isValidBdPhone } from '../utils/phone.js';
import { checkOtpRateLimit, sendBdBulkSms } from '../utils/sms.js';

/**
 * Extracts the real client IP address from the request headers or socket.
 * Works seamlessly behind proxies, Nginx, Cloudflare, or direct connections.
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * @route   POST /api/fraud/check-ip
 * @desc    Track client IP, check if it already exists in DB, and log the hit.
 */
export async function checkIpAndFraud(req, res, next) {
  try {
    const { phone } = req.body;
    const clientIp = getClientIp(req);

    const normalizedPhone = phone ? normalizePhoneNumber(phone) : '';

    // Check if an order has ALREADY been placed from this IP address or phone number
    const existingOrder = await Order.findOne({
      $or: [
        { ipAddress: clientIp },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    });

    const isAlreadyInDb = Boolean(existingOrder);

    // Save/update the IP tracking log in IpTrack DB
    await IpTrack.updateOne(
      { ip: clientIp },
      {
        $set: { lastSeen: new Date(), ...(normalizedPhone ? { phone: normalizedPhone } : {}) },
        $inc: { count: 1 },
      },
      { upsert: true }
    );

    // Automatically log/update UnfinishedOrder when phone is checked
    if (normalizedPhone) {
      UnfinishedOrder.updateOne(
        { phone: normalizedPhone },
        {
          $set: {
            phone: normalizedPhone,
            ipAddress: clientIp,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            customerName: req.body.customerName ? req.body.customerName.trim() : 'Customer',
            flavour: req.body.flavour || 'Dark Chocolate',
            price: req.body.price || 1200,
            status: 'Pending',
          },
        },
        { upsert: true }
      ).catch((err) => console.error('[UnfinishedOrder Error] Failed to log:', err.message));
    }

    return res.json({
      success: true,
      ip: clientIp,
      isAlreadyInDb,
      requiresOtp: isAlreadyInDb,
      data: {
        ip: clientIp,
        isAlreadyInDb,
        requiresOtp: isAlreadyInDb,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/fraud/send-otp
 * @desc    Generate and send a 4-digit OTP SMS to customer phone
 */
export async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;

    if (!phone || !isValidBdPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।',
      });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    // Enforce OTP rate limiting (max 3 per 15 mins)
    const allowed = checkOtpRateLimit(normalizedPhone);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: 'অনেকগুলো ওটিপি রিকোয়েস্ট করা হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।',
      });
    }

    // Generate random 4-digit OTP code
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store in OtpToken model (expires in 5 minutes)
    await OtpToken.deleteMany({ phone: normalizedPhone });
    await OtpToken.create({
      phone: normalizedPhone,
      code: otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const smsMessage = `আপনার Milkimom ভেরিফিকেশন ওটিপি (OTP) কোড: ${otpCode}। কোডটি কারো সাথে শেয়ার করবেন না।`;
    const smsResult = await sendBdBulkSms(normalizedPhone, smsMessage, 'otp');

    if (!smsResult.success) {
      console.error('[Fraud OTP Error] SMS delivery failed:', smsResult.error);
    }

    const isDev = process.env.NODE_ENV !== 'production';

    return res.json({
      success: true,
      message: 'ওটিপি (OTP) আপনার মোবাইল নম্বরে পাঠানো হয়েছে।',
      ...(isDev ? { devCode: otpCode } : {}),
      data: {
        message: 'ওটিপি (OTP) আপনার মোবাইল নম্বরে পাঠানো হয়েছে।',
        ...(isDev ? { devCode: otpCode } : {}),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/fraud/verify-otp
 * @desc    Verify customer-provided OTP code
 */
export async function verifyOtp(req, res, next) {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'মোবাইল নম্বর এবং ওটিপি কোড প্রদান করুন।',
      });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const codeTrimmed = String(code).trim();

    const tokenDoc = await OtpToken.findOne({
      phone: normalizedPhone,
      code: codeTrimmed,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'ভুল ওটিপি (OTP) কোড অথবা মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে সঠিক কোডটি দিন।',
        data: { verified: false },
      });
    }

    // OTP is valid! Clean up token.
    await OtpToken.deleteOne({ _id: tokenDoc._id });

    return res.json({
      success: true,
      verified: true,
      message: 'ওটিপি ভেরিফিকেশন সফল হয়েছে।',
      data: {
        verified: true,
        message: 'ওটিপি ভেরিফিকেশন সফল হয়েছে।',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   GET /api/fraud/steadfast-check
 * @desc    Check courier delivery history & fraud reports via Steadfast API for any phone number
 */
export async function checkSteadfastFraudByPhone(req, res, next) {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const { checkSteadfastFraud } = await import('../utils/steadfast.js');
    const result = await checkSteadfastFraud(phone);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    next(err);
  }
}
