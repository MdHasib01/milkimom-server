import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return secret;
}

/**
 * Requires a valid admin JWT in the Authorization header ("Bearer <token>").
 * Attaches the admin user document to req.admin.
 */
export async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const admin = await AdminUser.findById(payload.sub);
    if (!admin || !admin.active) {
      return res.status(401).json({ success: false, error: 'Account not found or deactivated' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}
