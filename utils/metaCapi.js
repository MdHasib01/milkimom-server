import crypto from 'crypto';
import { normalizePhoneNumber, maskPhoneNumber } from './phone.js';

/**
 * Meta (Facebook) Conversions API.
 *
 * Purchase is reported from the server only when an order reaches the
 * "Delivered" status — never from the browser at order time. Fake and
 * later-cancelled orders therefore never reach Meta as purchases, so ad
 * optimization learns only from real, completed sales.
 *
 * Required env:
 *   META_PIXEL_ID          — the pixel id (same one the browser snippet uses)
 *   META_CAPI_ACCESS_TOKEN — Conversions API system-user token
 *                            (Events Manager → Settings → Conversions API → Generate access token)
 * Optional env:
 *   META_TEST_EVENT_CODE     — while set, events land in Events Manager → Test events
 *   META_GRAPH_API_VERSION   — defaults to v23.0
 */

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v23.0';

/** SHA-256 hex hash of a trimmed, lowercased value — Meta's required PII format. */
function hash(value) {
  return crypto
    .createHash('sha256')
    .update(String(value).trim().toLowerCase())
    .digest('hex');
}

/**
 * Builds the hashed user_data block from an order. The more matched fields,
 * the better Meta can attribute the purchase back to the ad click.
 */
function buildUserData(order) {
  const userData = {};

  const phone = normalizePhoneNumber(order.phone);
  if (phone) userData.ph = [hash(phone)];
  if (order.alternativePhone) {
    const alt = normalizePhoneNumber(order.alternativePhone);
    if (alt && alt !== phone) userData.ph.push(hash(alt));
  }

  if (order.email) userData.em = [hash(order.email)];

  const name = (order.customerName || '').trim();
  if (name && name !== 'Customer' && name !== 'গ্রাহক') {
    const parts = name.split(/\s+/);
    userData.fn = [hash(parts[0])];
    if (parts.length > 1) userData.ln = [hash(parts.slice(1).join(' '))];
  }

  if (order.thana) userData.ct = [hash(order.thana)];
  if (order.district) userData.st = [hash(order.district)];
  userData.country = [hash('bd')];
  userData.external_id = [hash(order._id.toString())];

  // Non-hashed browser/network identifiers captured at order time.
  if (order.ipAddress) userData.client_ip_address = order.ipAddress;
  if (order.userAgent) userData.client_user_agent = order.userAgent;
  if (order.fbp) userData.fbp = order.fbp;
  if (order.fbc) userData.fbc = order.fbc;

  return userData;
}

/**
 * Sends a Purchase event for a delivered order to the Conversions API.
 * Returns true when Meta accepted the event, false otherwise. Never throws.
 *
 * event_id is the order id, so even if this is ever called twice for the same
 * order Meta deduplicates it on their side.
 */
export async function sendMetaPurchase(order) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn(
      '[Meta CAPI] META_PIXEL_ID / META_CAPI_ACCESS_TOKEN not configured — skipping Purchase event.'
    );
    return false;
  }

  const event = {
    event_name: 'Purchase',
    // Delivery confirmation time — the moment this became a real purchase.
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_id: order._id.toString(),
    user_data: buildUserData(order),
    custom_data: {
      currency: 'BDT',
      value: Number(order.price) || 0,
      content_name: order.product || 'Milkimom Complete Dose',
      content_type: 'product',
      contents: [{ id: order.product || 'milkimom-complete-dose', quantity: 1 }],
    },
  };
  if (order.pageUrl) event.event_source_url = order.pageUrl;

  const body = { data: [event] };
  if (process.env.META_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.events_received) {
      console.error(
        `[Meta CAPI] Purchase rejected for order ${order._id} (${maskPhoneNumber(order.phone)}):`,
        JSON.stringify(result?.error || result)
      );
      return false;
    }

    console.log(
      `[Meta CAPI] Purchase sent for delivered order ${order._id} (${maskPhoneNumber(order.phone)}), value ${event.custom_data.value} BDT`
    );
    return true;
  } catch (err) {
    console.error(`[Meta CAPI] Request failed for order ${order._id}:`, err.message);
    return false;
  }
}
