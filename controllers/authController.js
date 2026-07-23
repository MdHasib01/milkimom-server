import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { getJwtSecret } from '../middleware/auth.js';

// Basic in-memory rate limiting for login attempts: max 10 per IP per 15 minutes.
const loginAttempts = new Map();

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - 15 * 60 * 1000;
  let timestamps = loginAttempts.get(ip) || [];
  timestamps = timestamps.filter((ts) => ts > windowStart);
  if (timestamps.length >= 10) return false;
  timestamps.push(now);
  loginAttempts.set(ip, timestamps);
  return true;
}

/**
 * @route   POST /api/auth/login
 * @desc    Admin login, returns JWT
 */
export async function login(req, res, next) {
  try {
    if (!checkLoginRateLimit(req.ip)) {
      return res.status(429).json({ success: false, error: 'Too many login attempts. Try again later.' });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const admin = await AdminUser.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');
    if (!admin || !admin.active) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const valid = await admin.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = jwt.sign({ sub: admin._id.toString(), role: admin.role }, getJwtSecret(), {
      expiresIn: '12h',
    });

    res.json({ success: true, data: { token, user: admin.toSafeJSON() } });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   GET /api/auth/me
 * @desc    Returns the currently authenticated admin
 */
export async function me(req, res) {
  res.json({ success: true, data: req.admin.toSafeJSON() });
}
