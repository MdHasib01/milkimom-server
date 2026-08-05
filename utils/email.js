import nodemailer from 'nodemailer';
import Settings from '../models/Settings.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: host.trim(),
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: user.trim(),
      pass: pass.replace(/\s+/g, ''),
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
}

/**
 * Sends the new-order notification email to the configured admin email.
 * Admin email comes from Settings (configurable in the dashboard),
 * falling back to the ADMIN_EMAIL env variable.
 * Never throws — order creation must not fail because of email issues.
 */
export async function sendAdminOrderEmail(order) {
  try {
    const mailer = getTransporter();
    if (!mailer) {
      console.warn('[Email] SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS). Skipping admin email.');
      return { success: false, error: 'SMTP not configured' };
    }

    let to = process.env.ADMIN_EMAIL;
    try {
      const settings = await Settings.getGlobal();
      if (settings?.adminEmail && settings.adminEmail.trim()) {
        to = settings.adminEmail.trim();
      }
    } catch (dbErr) {
      console.warn('[Email] Could not fetch settings from DB, using ADMIN_EMAIL env fallback:', dbErr.message);
    }

    if (!to) {
      console.warn('[Email] No admin email configured in settings or ADMIN_EMAIL. Skipping admin email.');
      return { success: false, error: 'Admin email not configured' };
    }

    const rows = [
      ['Order ID', order._id.toString()],
      ['Product', order.product],
      ['Flavour', order.flavour],
      ['Payment', order.paymentMethod],
      ['Payment Status', order.paymentStatus],
      ['Total', `${order.price}/=`],
      ['Customer', order.customerName || 'Customer'],
      ['Phone', order.phone],
      ['Alt. Phone', order.alternativePhone || 'N/A'],
      ['Address', order.address || [order.thana, order.district].filter(Boolean).join(', ') || 'N/A'],
      ['Transaction ID', order.transactionId || 'N/A'],
      ['Order Time', new Date(order.orderTime || Date.now()).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })],
    ];

    const html = `
      <h2 style="color:#BD0052;">New Milkimom Order</h2>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:6px 12px;border:1px solid #eee;font-weight:bold;">${label}</td><td style="padding:6px 12px;border:1px solid #eee;">${value}</td></tr>`
          )
          .join('')}
      </table>
    `;

    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `🛒 New Milkimom Order — ${order.customerName} (${order.price}/=)`,
      html,
      text: rows.map(([label, value]) => `${label}: ${value}`).join('\n'),
    });

    console.log(`[Email] Admin order notification sent to ${to} (messageId: ${info.messageId})`);
    return { success: true };
  } catch (err) {
    console.error('[Email Error] Failed to send admin order email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a confirmation email to the customer if an email address is provided.
 * Never throws — order creation must not fail because of email issues.
 */
export async function sendCustomerOrderEmail(order) {
  try {
    if (!order.email || !order.email.includes('@')) {
      return { success: false, error: 'No valid customer email' };
    }

    const mailer = getTransporter();
    if (!mailer) {
      return { success: false, error: 'SMTP not configured' };
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #BD0052; text-align: center;">অর্ডার কনফার্মেশন - মিল্কিমম</h2>
        <p>প্রিয় <strong>${order.customerName}</strong>,</p>
        <p>মিল্কিমম-এ অর্ডার করার জন্য আপনাকে ধন্যবাদ! আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top:0; color: #333;">অর্ডারের বিবরণ</h3>
          <p><strong>অর্ডার আইডি:</strong> ${order._id}</p>
          <p><strong>পণ্য:</strong> ${order.product}</p>
          <p><strong>ফ্লেভার:</strong> ${order.flavour}</p>
          <p><strong>মোট মূল্য:</strong> ৳${order.price}</p>
          <p><strong>পেমেন্ট পদ্ধতি:</strong> ${order.paymentMethod}</p>
          <p><strong>ডেলিভারি ঠিকানা:</strong> ${[order.address, order.thana, order.district].filter(Boolean).join(', ')}</p>
        </div>
        <p style="color: #666; font-size: 14px;">আমাদের একজন প্রতিনিধি খুব শীঘ্রই আপনার সাথে যোগাযোগ করে ডেলিভারির সময়সূচী নিশ্চিত করবেন।</p>
      </div>
    `;

    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: order.email,
      subject: `🎉 Milkimom Order Confirmation — Order #${order._id.toString().slice(-6)}`,
      html,
    });

    console.log(`[Email] Customer order confirmation sent to ${order.email} (messageId: ${info.messageId})`);
    return { success: true };
  } catch (err) {
    console.error('[Email Error] Failed to send customer order email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Generates an 8-character random key for user passwords.
 */
export function generateRandomPassword(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sends an email to an admin user with their temporary password credentials.
 * Used upon admin user creation and password resets.
 */
export async function sendAdminUserCredentialEmail(user, plainPassword, type = 'created') {
  try {
    const mailer = getTransporter();
    if (!mailer) {
      console.warn('[Email] SMTP is not configured. Skipping admin user credential email.');
      return { success: false, error: 'SMTP not configured' };
    }

    const isReset = type === 'reset';
    const title = isReset ? 'পাসওয়ার্ড রিসেট তথ্য' : 'নতুন এডমিন অ্যাকাউন্ট তথ্য';
    const subject = isReset ? '🔑 Password Reset - Milkimom Admin' : '🔑 Your Milkimom Admin Credentials';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #BD0052; text-align: center; margin-top: 0;">${title}</h2>
        <p>প্রিয় <strong>${user.name}</strong>,</p>
        <p>${isReset ? 'আপনার মিল্কিমম এডমিন পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে।' : 'আপনাকে মিল্কিমম এডমিন প্যানেলে স্বাগতম! আপনার অ্যাকাউন্ট সফলভাবে তৈরি করা হয়েছে।'}</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1e293b; margin-bottom: 12px;">লগইন বিবরণ:</h4>
          <p style="margin: 6px 0;"><strong>ইমেইল:</strong> ${user.email}</p>
          <p style="margin: 6px 0;"><strong>রোল:</strong> <span style="text-transform: capitalize;">${user.role}</span></p>
          <p style="margin: 14px 0 6px 0; font-weight: bold; color: #1e293b;">নতুন পাসওয়ার্ড:</p>
          <div style="background-color: #f1f5f9; border: 2px dashed #BD0052; border-radius: 10px; padding: 14px 20px; text-align: center; margin: 8px 0 12px 0;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: 800; letter-spacing: 6px; color: #BD0052; display: inline-block;">${plainPassword}</span>
          </div>
        </div>

        <p style="color: #e11d48; font-weight: bold; font-size: 13px;">⚠️ প্রথমবার লগইন করার সাথে সাথেই নিরাপত্তা নিশ্চিত করতে পাসওয়ার্ডটি পরিবর্তন করে নিন।</p>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://milkimom.com/admin/login" style="background-color: #BD0052; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">এডমিন প্যানেলে লগইন করুন</a>
        </div>
      </div>
    `;

    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: user.email,
      subject,
      html,
    });

    console.log(`[Email] Admin user credential email sent to ${user.email} (messageId: ${info.messageId})`);
    return { success: true };
  } catch (err) {
    console.error('[Email Error] Failed to send admin user credential email:', err.message);
    return { success: false, error: err.message };
  }
}

