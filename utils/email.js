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
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user, pass },
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

    const settings = await Settings.getGlobal();
    const to = settings.adminEmail || process.env.ADMIN_EMAIL;
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
      ['Customer', order.customerName],
      ['Phone', order.phone],
      ['Alt. Phone', order.alternativePhone || 'N/A'],
      ['District', order.district],
      ['Thana', order.thana],
      ['Address', order.address],
      ['Transaction ID', order.transactionId || 'N/A'],
      ['Order Time', new Date(order.orderTime).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })],
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
