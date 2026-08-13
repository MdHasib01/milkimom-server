import crypto from 'crypto';
import { normalizePhoneNumber, maskPhoneNumber } from './phone.js';

/**
 * Meta (Facebook) Conversions API.
 *
 * Purchase is reported from the server only once an order has been Confirmed
 * by an admin — never from the browser at order time. Fake orders therefore
 * never reach Meta as purchases, so ad optimization learns only from sales a
 * human has vouched for.
 *
 * The site runs two landing pages selling two different products at two
 * different prices from one shared pixel. They are told apart by
 * `content_ids`/`content_name` (milkimom vs smoothflow) and by the value.
 * Flavour is deliberately NOT reported — it is an internal catalog detail with
 * no meaning to the ad account.
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

/** Human-facing product name per landing page, reported as content_name. */
const PRODUCT_LABELS = {
  milkimom: 'Milkimom',
  smoothflow: 'SmoothFlow',
};

/**
 * Meta rejects events with an event_time older than 7 days. Orders are usually
 * confirmed within a day or two, so the order time is both safe and the better
 * signal — it sits next to the ad click. This is the margin we keep.
 */
const MAX_EVENT_AGE_MS = 6.5 * 24 * 60 * 60 * 1000;

/** SHA-256 hex hash of a trimmed, lowercased value — Meta's required PII format. */
function hash(value) {
  return crypto
    .createHash('sha256')
    .update(String(value).trim().toLowerCase())
    .digest('hex');
}

/** City/state match keys must be lowercase with no spaces or punctuation. */
function hashPlace(value) {
  const cleaned = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9ঀ-৿]/g, '');
  return cleaned ? hash(cleaned) : null;
}

/**
 * Builds the hashed user_data block from an order. The more matched fields,
 * the better Meta can attribute the purchase back to the ad click.
 */
function buildUserData(order) {
  const userData = {};

  const phone = normalizePhoneNumber(order.phone);
  const phones = [];
  if (phone) phones.push(hash(phone));
  if (order.alternativePhone) {
    const alt = normalizePhoneNumber(order.alternativePhone);
    if (alt && alt !== phone) phones.push(hash(alt));
  }
  if (phones.length) userData.ph = phones;

  if (order.email) userData.em = [hash(order.email)];

  const name = (order.customerName || '').trim();
  if (name && name !== 'Customer' && name !== 'গ্রাহক') {
    const parts = name.split(/\s+/);
    userData.fn = [hash(parts[0])];
    if (parts.length > 1) userData.ln = [hash(parts.slice(1).join(' '))];
  }

  // The order form collects one free-text address line, so thana/district are
  // usually empty — fall back to the IP geolocation captured at order time.
  const city = hashPlace(order.thana || order.ipLocation?.city);
  if (city) userData.ct = [city];

  const state = hashPlace(order.district || order.ipLocation?.region);
  if (state) userData.st = [state];

  if (order.ipLocation?.postal) userData.zp = [hash(order.ipLocation.postal)];

  userData.country = [hash('bd')];
  userData.external_id = [hash(order._id.toString())];

  // Non-hashed browser/network identifiers captured at order time.
  if (order.ipAddress) userData.client_ip_address = order.ipAddress;
  if (order.userAgent) userData.client_user_agent = order.userAgent;
  if (order.fbp) userData.fbp = order.fbp;

  const fbc = order.fbc || rebuildFbc(order);
  if (fbc) userData.fbc = fbc;

  return userData;
}

/**
 * Reconstructs the `_fbc` cookie value from the raw fbclid captured on the
 * landing page, for visitors whose cookie never made it onto the order.
 *
 * The timestamp must be when the click happened, not now — this runs days
 * later, at confirmation time, so it uses the stored landing time.
 */
function rebuildFbc(order) {
  const fbclid = order.attribution?.fbclid;
  if (!fbclid) return '';

  const firstSeen = order.attribution?.firstSeenAt || order.orderTime || order.createdAt;
  const clickMs = firstSeen ? new Date(firstSeen).getTime() : NaN;
  if (!Number.isFinite(clickMs)) return '';

  return `fb.1.${clickMs}.${fbclid}`;
}

/** Order time when it is recent enough for Meta to accept, otherwise now. */
function resolveEventTime(order) {
  const raw = order.orderTime || order.createdAt;
  const ms = raw ? new Date(raw).getTime() : NaN;

  if (!Number.isFinite(ms) || Date.now() - ms > MAX_EVENT_AGE_MS) {
    return Math.floor(Date.now() / 1000);
  }
  return Math.floor(ms / 1000);
}

/**
 * Sends a Purchase event for a confirmed order to the Conversions API.
 * Never throws. Returns { sent, value, error }.
 *
 * event_id is the order id, so even if this is ever called twice for the same
 * order Meta deduplicates it on their side.
 */
export async function sendMetaPurchase(order) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  const slug = order.productSlug === 'smoothflow' ? 'smoothflow' : 'milkimom';
  const value = Number(order.price) || 0;

  if (!pixelId || !accessToken) {
    const error = 'META_PIXEL_ID / META_CAPI_ACCESS_TOKEN not configured';
    console.warn(`[Meta CAPI] ${error} — skipping Purchase event.`);
    return { sent: false, value, error };
  }

  const event = {
    event_name: 'Purchase',
    event_time: resolveEventTime(order),
    action_source: 'website',
    event_id: order._id.toString(),
    user_data: buildUserData(order),
    // Product identity and price only. Which landing page sold it is the whole
    // point — it is what lets one pixel report on two products separately.
    custom_data: {
      currency: 'BDT',
      value,
      content_type: 'product',
      content_ids: [slug],
      content_name: PRODUCT_LABELS[slug],
      content_category: slug,
      contents: [{ id: slug, quantity: 1, item_price: value }],
      order_id: order._id.toString(),
    },
  };

  const sourceUrl = order.pageUrl || order.attribution?.landingUrl;
  if (sourceUrl) event.event_source_url = sourceUrl;

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
      const error = result?.error?.message || JSON.stringify(result?.error || result);
      console.error(
        `[Meta CAPI] Purchase rejected for order ${order._id} (${maskPhoneNumber(order.phone)}):`,
        error
      );
      return { sent: false, value, error };
    }

    console.log(
      `[Meta CAPI] Purchase sent for confirmed order ${order._id} (${maskPhoneNumber(order.phone)}) — ${slug}, ${value} BDT`
    );
    return { sent: true, value, error: '' };
  } catch (err) {
    console.error(`[Meta CAPI] Request failed for order ${order._id}:`, err.message);
    return { sent: false, value, error: err.message };
  }
}
