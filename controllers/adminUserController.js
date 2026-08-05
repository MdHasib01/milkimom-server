import AdminUser from '../models/AdminUser.js';
import { generateRandomPassword, sendAdminUserCredentialEmail } from '../utils/email.js';

/**
 * @route   GET /api/admin-users
 * @desc    List all admin users
 */
export async function getAdminUsers(req, res, next) {
  try {
    const users = await AdminUser.find().sort({ createdAt: 1 });
    res.json({ success: true, data: users.map((u) => u.toSafeJSON()) });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/admin-users
 * @desc    Create a new admin user (auto-generates 8-character random key if password not provided, sends email)
 */
export async function createAdminUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const validRoles = ['superadmin', 'admin', 'moderator'];
    const userRole = validRoles.includes(role) ? role : 'admin';

    const existing = await AdminUser.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An admin user with this email already exists' });
    }

    // Auto-generate 8-character random password if not provided
    const plainPassword = password && String(password).trim().length >= 6
      ? String(password).trim()
      : generateRandomPassword(8);

    const user = await AdminUser.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash: await AdminUser.hashPassword(plainPassword),
      role: userRole,
      mustChangePassword: true,
    });

    // Send email with login credentials
    sendAdminUserCredentialEmail(user, plainPassword, 'created').catch((err) =>
      console.error('[Email Error] Non-blocking credential email failed:', err.message)
    );

    res.status(201).json({
      success: true,
      data: {
        ...user.toSafeJSON(),
        generatedPassword: plainPassword,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/admin-users/:id/reset-password
 * @desc    Superadmin resets user password (generates new 8-character key & sends email)
 */
export async function resetAdminUserPassword(req, res, next) {
  try {
    // Only superadmin can reset passwords
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Only super admins can reset passwords' });
    }

    const user = await AdminUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Admin user not found' });
    }

    const newPassword = generateRandomPassword(8);
    user.passwordHash = await AdminUser.hashPassword(newPassword);
    user.mustChangePassword = true;
    await user.save();

    // Send email notification with new temporary password
    sendAdminUserCredentialEmail(user, newPassword, 'reset').catch((err) =>
      console.error('[Email Error] Reset credential email failed:', err.message)
    );

    res.json({
      success: true,
      message: 'Password reset successfully and email notification sent',
      data: {
        ...user.toSafeJSON(),
        generatedPassword: newPassword,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   PATCH /api/admin-users/:id
 * @desc    Update an admin user (name, role, active)
 */
export async function updateAdminUser(req, res, next) {
  try {
    const { name, role, active } = req.body;

    const user = await AdminUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Admin user not found' });
    }

    // Prevent locking yourself out by deactivating your own account
    if (active === false && user._id.equals(req.admin._id)) {
      return res.status(400).json({ success: false, error: 'You cannot deactivate your own account' });
    }

    if (name !== undefined) user.name = String(name).trim();
    if (role !== undefined && ['superadmin', 'admin', 'moderator'].includes(role)) {
      user.role = role;
    }
    if (active !== undefined) user.active = Boolean(active);

    await user.save();
    res.json({ success: true, data: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   DELETE /api/admin-users/:id
 * @desc    Delete an admin user
 */
export async function deleteAdminUser(req, res, next) {
  try {
    const user = await AdminUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Admin user not found' });
    }

    if (user._id.equals(req.admin._id)) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }

    const total = await AdminUser.countDocuments({ active: true });
    if (total <= 1) {
      return res.status(400).json({ success: false, error: 'Cannot delete the last admin user' });
    }

    await user.deleteOne();
    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
}
