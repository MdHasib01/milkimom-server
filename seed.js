/**
 * Seeds the first admin user and default settings.
 *
 * Usage:  npm run seed
 *
 * Configure via .env:
 *   SEED_ADMIN_NAME      (default: "Admin")
 *   SEED_ADMIN_EMAIL     (default: ADMIN_EMAIL or "admin@milkimom.com")
 *   SEED_ADMIN_PASSWORD  (default: "milkimom123" — change after first login!)
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import AdminUser from './models/AdminUser.js';
import Settings from './models/Settings.js';
import LandingPageTheme from './models/LandingPageTheme.js';
import LandingPageContent from './models/LandingPageContent.js';

dotenv.config();

async function seed() {
  await connectDB();

  const name = process.env.SEED_ADMIN_NAME || 'Admin';
  const email = (process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@milkimom.com')
    .toLowerCase()
    .trim();
  const password = process.env.SEED_ADMIN_PASSWORD || 'milkimom123';

  // Settings singleton (admin email / mobile configurable later in dashboard)
  const settings = await Settings.getGlobal();
  console.log(`[Seed] Settings ready (adminEmail: "${settings.adminEmail || '-'}", adminMobile: "${settings.adminMobile || '-'}")`);

  // Default product landing page themes
  const milkimomTheme = await LandingPageTheme.getThemeBySlug('milkimom');
  const smoothflowTheme = await LandingPageTheme.getThemeBySlug('smoothflow');
  console.log(`[Seed] Product Landing Themes ready: "${milkimomTheme.productSlug}" (${milkimomTheme.themeColor}), "${smoothflowTheme.productSlug}" (${smoothflowTheme.themeColor})`);

  // Default section content
  const milkimomContent = await LandingPageContent.getContentBySlug('milkimom');
  const smoothflowContent = await LandingPageContent.getContentBySlug('smoothflow');
  console.log(`[Seed] Section Content ready: "${milkimomContent.productSlug}", "${smoothflowContent.productSlug}"`);

  const existing = await AdminUser.findOne({ email });
  if (existing) {
    console.log(`[Seed] Admin user already exists: ${email} — nothing to do.`);
  } else {
    await AdminUser.create({
      name,
      email,
      passwordHash: await AdminUser.hashPassword(password),
      role: 'superadmin',
    });
    console.log(`[Seed] Created first admin user:`);
    console.log(`       Email:    ${email}`);
    console.log(`       Password: ${password}`);
    console.log('       ⚠ Change this password after first login (Admin → Users).');
  }

  await mongoose.disconnect();
  console.log('[Seed] Done.');
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
