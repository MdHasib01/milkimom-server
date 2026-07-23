import Settings from '../models/Settings.js';
import { isValidBdPhone } from '../utils/phone.js';

/**
 * @route   GET /api/settings
 * @desc    Get global settings (admin email, admin mobile)
 */
export async function getSettings(req, res, next) {
  try {
    const settings = await Settings.getGlobal();
    res.json({
      success: true,
      data: {
        adminEmail: settings.adminEmail,
        adminMobile: settings.adminMobile,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   PUT /api/settings
 * @desc    Update global settings
 */
export async function updateSettings(req, res, next) {
  try {
    const { adminEmail, adminMobile } = req.body;

    if (adminEmail !== undefined && adminEmail !== '' && !/^\S+@\S+\.\S+$/.test(adminEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid admin email address' });
    }
    if (adminMobile !== undefined && adminMobile !== '' && !isValidBdPhone(adminMobile)) {
      return res.status(400).json({ success: false, error: 'Invalid admin mobile number' });
    }

    const settings = await Settings.getGlobal();
    if (adminEmail !== undefined) settings.adminEmail = adminEmail;
    if (adminMobile !== undefined) settings.adminMobile = adminMobile;
    await settings.save();

    res.json({
      success: true,
      data: {
        adminEmail: settings.adminEmail,
        adminMobile: settings.adminMobile,
      },
    });
  } catch (err) {
    next(err);
  }
}
