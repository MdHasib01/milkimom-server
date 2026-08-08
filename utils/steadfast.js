import Settings from '../models/Settings.js';
import Order from '../models/Order.js';
import Flavour from '../models/Flavour.js';
import { maskPhoneNumber } from './phone.js';

/**
 * Steadfast Courier integration (https://steadfast.com.bd).
 *
 * When an order is Confirmed it is auto-entered as a consignment in the
 * merchant's Steadfast account, and a cron job periodically pulls the courier
 * delivery status back onto the order (Delivered / Cancelled).
 *
 * Credentials are configured from the admin dashboard (Settings → Steadfast
 * Courier tab) and stored in the Settings document; the STEADFAST_API_KEY /
 * STEADFAST_SECRET_KEY env variables act as a fallback. Get the keys from the
 * Steadfast merchant panel: https://steadfast.com.bd → API.
 */

const BASE_URL = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';

// Steadfast delivery statuses that mean the parcel's journey is over — orders
// in these states are no longer polled by the sync cron.
const TERMINAL_STATUSES = ['delivered', 'partial_delivered', 'cancelled'];

/**
 * Resolves the active Steadfast credentials. Returns null when the
 * integration is disabled or not configured.
 */
export async function getSteadfastConfig() {
  let settings = null;
  try {
    settings = await Settings.getGlobal();
  } catch (err) {
    console.warn('[Steadfast] Could not load settings from DB:', err.message);
  }

  const apiKey = settings?.steadfastApiKey?.trim() || process.env.STEADFAST_API_KEY || '';
  const secretKey = settings?.steadfastSecretKey?.trim() || process.env.STEADFAST_SECRET_KEY || '';
  const enabled = settings ? Boolean(settings.steadfastEnabled) : Boolean(apiKey && secretKey);

  if (!enabled || !apiKey || !secretKey) return null;
  return { apiKey, secretKey };
}

/** Low-level request helper. Throws on network errors; returns parsed JSON. */
async function steadfastRequest(config, path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Api-Key': config.apiKey,
      'Secret-Key': config.secretKey,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, httpStatus: response.status, body };
}

/** Steadfast wants the local 11-digit format (01XXXXXXXXX). */
function toLocalPhone(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (clean.length === 13 && clean.startsWith('8801')) return clean.slice(2);
  return clean;
}

/**
 * Checks the merchant account balance — used by the admin settings "Test
 * connection" button. Accepts explicit credentials so keys can be verified
 * before they are saved. Returns { success, balance?, error? }.
 */
export async function getSteadfastBalance(credentials) {
  const config = credentials?.apiKey && credentials?.secretKey ? credentials : await getSteadfastConfig();
  if (!config) {
    return { success: false, error: 'Steadfast is not configured' };
  }

  try {
    const { ok, body } = await steadfastRequest(config, '/get_balance');
    if (!ok || body.status !== 200) {
      return { success: false, error: body?.message || 'Invalid API credentials' };
    }
    return { success: true, balance: body.current_balance };
  } catch (err) {
    return { success: false, error: `Could not reach Steadfast: ${err.message}` };
  }
}

/**
 * Creates a Steadfast consignment for a Confirmed order and stores the
 * consignment id / tracking code on the order document.
 *
 * The order's steadfastConsignmentId is claimed atomically before the API
 * call, so concurrent confirmations can never create a duplicate entry.
 * Returns { success, order?, error? } and never throws.
 */
export async function sendOrderToSteadfast(orderId) {
  const config = await getSteadfastConfig();
  if (!config) {
    return { success: false, error: 'Steadfast integration is disabled or not configured' };
  }

  // Claim the order: only proceed if no consignment exists and none is being
  // created right now (steadfastSentAt doubles as the in-flight lock).
  const order = await Order.findOneAndUpdate(
    { _id: orderId, steadfastConsignmentId: '', steadfastSentAt: null },
    { $set: { steadfastSentAt: new Date(), steadfastLastError: '' } },
    { new: true }
  );
  if (!order) {
    return { success: false, error: 'Order already sent to Steadfast (or not found)' };
  }

  const releaseClaim = (errorMsg) =>
    Order.updateOne(
      { _id: order._id, steadfastConsignmentId: '' },
      { $set: { steadfastSentAt: null, steadfastLastError: errorMsg.slice(0, 500) } }
    ).catch(() => {});

  const recipientAddress =
    [order.address, order.thana, order.district].filter(Boolean).join(', ') || 'N/A';

  // Weight and invoice code come from the admin-managed flavour catalog
  // (Settings → Products); built-in defaults cover unmatched flavours.
  const flavour = await Flavour.findByOrderFlavour(order.flavour).catch(() => null);
  const weightKg = Number(flavour?.weight) > 0 ? Number(flavour.weight) : 0.5;
  const invoice = flavour?.invoiceCode
    ? `${flavour.invoiceCode}-${order._id.toString()}`
    : order._id.toString();

  const payload = {
    invoice,
    recipient_name: (order.customerName || 'Customer').slice(0, 100),
    recipient_phone: toLocalPhone(order.phone),
    recipient_address: recipientAddress.slice(0, 250),
    // Prepaid (bKash) orders have nothing left to collect on delivery.
    cod_amount: order.paymentStatus === 'Paid' ? 0 : Number(order.price) || 0,
    weight: weightKg,
    item_description: `${order.product || 'Milkimom Complete Dose'} - ${order.flavour} (${weightKg} kg)`,
    note: order.alternativePhone ? `Alt phone: ${toLocalPhone(order.alternativePhone)}` : '',
  };

  try {
    const { ok, body } = await steadfastRequest(config, '/create_order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const consignment = body?.consignment;
    if (!ok || body?.status !== 200 || !consignment?.consignment_id) {
      const errorMsg =
        typeof body?.errors === 'object'
          ? JSON.stringify(body.errors)
          : body?.message || `Steadfast rejected the order (HTTP status ${body?.status})`;
      console.error(
        `[Steadfast] Entry rejected for order ${order._id} (${maskPhoneNumber(order.phone)}):`,
        errorMsg
      );
      await releaseClaim(errorMsg);
      return { success: false, error: errorMsg };
    }

    const updated = await Order.findByIdAndUpdate(
      order._id,
      {
        $set: {
          steadfastConsignmentId: String(consignment.consignment_id),
          steadfastTrackingCode: consignment.tracking_code || '',
          steadfastStatus: consignment.status || 'in_review',
          steadfastLastError: '',
        },
      },
      { new: true }
    );

    console.log(
      `[Steadfast] Consignment ${consignment.consignment_id} (${consignment.tracking_code}) created for order ${order._id} (${maskPhoneNumber(order.phone)})`
    );
    return { success: true, order: updated };
  } catch (err) {
    console.error(`[Steadfast] Request failed for order ${order._id}:`, err.message);
    await releaseClaim(err.message);
    return { success: false, error: `Could not reach Steadfast: ${err.message}` };
  }
}

/**
 * Fetches the current delivery status of one consignment.
 * Returns the raw Steadfast status string, or null on failure.
 */
async function fetchDeliveryStatus(config, consignmentId) {
  const { ok, body } = await steadfastRequest(config, `/status_by_cid/${consignmentId}`);
  if (!ok || body?.status !== 200 || !body?.delivery_status) return null;
  return String(body.delivery_status);
}

/** Maps a Steadfast delivery status onto the local order status (or null = keep). */
function mapSteadfastStatus(deliveryStatus) {
  // partial_delivered still means the customer received the product — there is
  // only one product, so treat it as delivered.
  if (deliveryStatus === 'delivered' || deliveryStatus === 'partial_delivered') return 'Delivered';
  if (deliveryStatus === 'cancelled') return 'Cancelled';
  return null;
}

/**
 * Cron worker: enters every Confirmed/Shipped order that doesn't have a
 * consignment yet. This is the safety net that makes the integration fully
 * automatic — orders whose instant entry failed (network hiccup, courier
 * downtime) and orders confirmed while the integration was disabled are
 * picked up on the next run, no manual action needed.
 */
export async function pushPendingSteadfastEntries() {
  const config = await getSteadfastConfig();
  if (!config) return { attempted: 0, created: 0 };

  // Release claims from attempts that never finished (server restarted
  // mid-request). Without this they would stay locked forever, and entry is
  // fully automatic — there is no manual send to fall back on.
  const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
  await Order.updateMany(
    { steadfastConsignmentId: '', steadfastSentAt: { $ne: null, $lt: staleBefore } },
    { $set: { steadfastSentAt: null } }
  ).catch((err) => console.error('[Steadfast] Could not release stale claims:', err.message));

  // Failed attempts release the steadfastSentAt claim, so this query finds
  // never-tried, previously-failed and recovered-stale orders alike.
  const orders = await Order.find({
    status: { $in: ['Confirmed', 'Shipped'] },
    steadfastConsignmentId: '',
    steadfastSentAt: null,
  })
    .sort({ createdAt: 1 })
    .limit(50)
    .select('_id');

  let created = 0;
  for (const { _id } of orders) {
    try {
      const result = await sendOrderToSteadfast(_id);
      if (result.success) created += 1;
    } catch (err) {
      console.error(`[Steadfast] Auto entry failed for order ${_id}:`, err.message);
    }
  }

  return { attempted: orders.length, created };
}

/**
 * Cron worker: pulls delivery status from Steadfast for every order that has
 * a consignment but hasn't reached a final state yet, and applies
 * Delivered/Cancelled to the order. onDelivered(order) is invoked when an
 * order transitions to Delivered (used to report the Meta CAPI Purchase).
 */
export async function syncSteadfastStatuses(onDelivered) {
  const config = await getSteadfastConfig();
  if (!config) return { synced: 0, updated: 0 };

  const orders = await Order.find({
    steadfastConsignmentId: { $ne: '' },
    status: { $in: ['Confirmed', 'Shipped'] },
    $or: [
      { steadfastStatus: { $nin: TERMINAL_STATUSES } },
      { steadfastStatus: '' },
    ],
  })
    .sort({ steadfastLastSyncAt: 1 })
    .limit(100);

  let updated = 0;
  for (const order of orders) {
    try {
      const deliveryStatus = await fetchDeliveryStatus(config, order.steadfastConsignmentId);
      if (!deliveryStatus) continue;

      const update = {
        steadfastStatus: deliveryStatus,
        steadfastLastSyncAt: new Date(),
      };

      const newStatus = mapSteadfastStatus(deliveryStatus);
      if (newStatus && newStatus !== order.status) {
        update.status = newStatus;
        update.statusUpdatedBy = 'Steadfast (auto sync)';
        update.statusUpdatedAt = new Date();
      }

      const saved = await Order.findByIdAndUpdate(order._id, { $set: update }, { new: true });
      if (update.status) {
        updated += 1;
        console.log(
          `[Steadfast] Order ${order._id} auto-updated to ${update.status} (courier status: ${deliveryStatus})`
        );
        if (update.status === 'Delivered' && typeof onDelivered === 'function') {
          await onDelivered(saved);
        }
      } else if (deliveryStatus !== order.steadfastStatus) {
        console.log(`[Steadfast] Order ${order._id} courier status: ${deliveryStatus}`);
      }
    } catch (err) {
      console.error(`[Steadfast] Status sync failed for order ${order._id}:`, err.message);
    }
  }

  return { synced: orders.length, updated };
}
