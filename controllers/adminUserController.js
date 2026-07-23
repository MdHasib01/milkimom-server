import AdminUser from '../models/AdminUser.js';

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
 * @desc    Create a new admin user
 */
export async function createAdminUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const existing = await AdminUser.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An admin with this email already exists' });
    }

    const user = await AdminUser.create({
      name,
      email,
      passwordHash: await AdminUser.hashPassword(password),
      role: role === 'superadmin' ? 'superadmin' : 'admin',
    });

    res.status(201).json({ success: true, data: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   PATCH /api/admin-users/:id
 * @desc    Update an admin user (name, password, active)
 */
export async function updateAdminUser(req, res, next) {
  try {
    const { name, password, active } = req.body;

    const user = await AdminUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Admin user not found' });
    }

    // Prevent locking yourself out by deactivating your own account
    if (active === false && user._id.equals(req.admin._id)) {
      return res.status(400).json({ success: false, error: 'You cannot deactivate your own account' });
    }

    if (name !== undefined) user.name = name;
    if (active !== undefined) user.active = Boolean(active);
    if (password) {
      if (String(password).length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }
      user.passwordHash = await AdminUser.hashPassword(password);
    }

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
