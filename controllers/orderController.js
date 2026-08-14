import Order from '../models/Order.js';
import Flavour from '../models/Flavour.js';
import IpTrack from '../models/IpTrack.js';
import UnfinishedOrder from '../models/UnfinishedOrder.js';
import Settings from '../models/Settings.js';
import { isValidBdPhone, normalizePhoneNumber } from '../utils/phone.js';
import { sendAdminOrderEmail, sendCustomerOrderEmail } from '../utils/email.js';
import { sendBdBulkSms } from '../utils/sms.js';
import { sendMetaPurchase } from '../utils/metaCapi.js';
import { sendOrderToSteadfast, checkSteadfastFraud } from '../utils/steadfast.js';
import { getClientIp } from './fraudController.js';
import { getIpLocationIfEnabled } from '../utils/ipinfo.js';

const FLAVOUR_MAP = {
  'ডার্ক চকলেট': 'Dark Chocolate',
  'ভ্যানিলা': 'Vanilla',
  'এলাচ': 'Cardamom',
  'দারুচিনি': 'Cinnamon',
};

/** Default product name per landing page, used when the client sends none. */
const PRODUCT_NAMES = {
  milkimom: 'Milkimom Complete Dose',
  smoothflow: 'SmoothFlow Complete Dose',
  milkready: 'MilkReady Complete Dose',
};

/**
 * Order statuses that count as a real purchase for Meta. Confirmed is the
 * trigger — an admin has vetted the order on /admin/orders. Shipped and
 * Delivered are included so an order that skips Confirmed (the Steadfast sync
 * cron can set Delivered directly) is still reported; the metaPurchaseSentAt
 * claim guarantees only one Purchase is ever sent per order.
 */
export const PURCHASE_STATUSES = ['Confirmed', 'Shipped', 'Delivered'];

/** Every attribution key accepted from the browser, in Order.attribution shape. */
const ATTRIBUTION_KEYS = [
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'ttclid',
  'msclkid',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmTerm',
  'utmContent',
  'referrer',
  'landingUrl',
  'landingPath',
];

function normalizeProductSlug(slug) {
  const s = String(slug || '').toLowerCase().trim();
  if (s === 'smoothflow') return 'smoothflow';
  if (s === 'milkready') return 'milkready';
  return 'milkimom';
}

/**
 * Trims client-supplied attribution down to the known keys, capping each at
 * 500 chars — the same defensive treatment fbp/fbc already get. Returns an
 * object holding only the keys that actually carry a value.
 */
function sanitizeAttribution(raw) {
  const clean = {};
  if (!raw || typeof raw !== 'object') return clean;

  for (const key of ATTRIBUTION_KEYS) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) {
      clean[key] = value.trim().slice(0, 500);
    }
  }

  const firstSeen = raw.firstSeenAt ? new Date(raw.firstSeenAt) : null;
  if (firstSeen && !Number.isNaN(firstSeen.getTime())) {
    clean.firstSeenAt = firstSeen;
  }

  return clean;
}

/**
 * Sends a confirmation SMS to the customer when an order is created.
 * Never throws — order creation must not block if SMS fails.
 */
async function sendCustomerOrderSms(order) {
  try {
    if (!order.phone) return;

    const orderIdStr = order._id ? order._id.toString() : '';
    let baseUrl = (process.env.CLIENT_URL || process.env.SITE_URL || 'https://milkimom.com').trim().replace(/\/+$/, '');
    if (!baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl.replace(/^https?:\/\//i, '');
    }

    const message = `অভিনন্দন Great মা!\n\nআপনার Milkimom অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে৷\n\nইনশাআল্লাহ ২–৩ কার্যদিবসের মধ্যে আপনার অর্ডারটি আপনার ঠিকানায় পৌঁছে যাবে৷\n\nঅর্ডার ট্র্যাক করুন:\n${baseUrl}/track/${orderIdStr}\n\nযেকোনো প্রয়োজনে যোগাযোগ করুন:\n\nWhatsApp:\n01517-102603\n\nMilkimom\nMake Mother Great Again.`;

    await sendBdBulkSms(order.phone, message, 'customer_confirmation');
  } catch (err) {
    console.error('[Customer SMS Error] Failed to send customer order SMS:', err.message);
  }
}

/**
 * Sends the new-order SMS to the admin mobile configured in Settings
 * (falls back to the ADMIN_PHONE env variable). Never throws.
 */
async function sendAdminOrderSms(order) {
  try {
    let to = process.env.ADMIN_PHONE;
    try {
      const settings = await Settings.getGlobal();
      if (settings?.adminMobile && settings.adminMobile.trim()) {
        to = settings.adminMobile.trim();
      }
    } catch (dbErr) {
      console.warn('[SMS] Could not fetch settings from DB, using ADMIN_PHONE env fallback:', dbErr.message);
    }

    if (!to) {
      console.warn('[SMS] No admin mobile configured in settings or ADMIN_PHONE. Skipping admin SMS.');
      return;
    }

    const locationStr = order.address || [order.thana, order.district].filter(Boolean).join(', ') || 'N/A';
    let message = `নতুন Milkimom অর্ডার\n\nনাম: ${order.customerName}\nফোন: ${order.phone}\nঠিকানা: ${locationStr}\nফ্লেভার: ${order.flavour}\nপেমেন্ট: ${order.paymentStatus === 'Paid' ? 'bKash' : 'Cash on Delivery'}`;
    if (order.transactionId) {
      message += `\nTrx ID: ${order.transactionId}`;
    }
    message += `\nমোট: ${order.price}/=`;

    await sendBdBulkSms(to, message, 'admin_notification');
  } catch (err) {
    console.error('[SMS Error] Failed to send admin order SMS:', err.message);
  }
}

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 */
export async function createOrder(req, res, next) {
  try {
    const {
      product,
      customerName,
      phone,
      alternativePhone,
      email,
      district,
      thana,
      address,
      flavour,
      paymentMethod,
      price,
      transactionId,
      screenshotUploaded,
      pageUrl,
      orderTime,
      fbp,
      fbc,
      productSlug,
      attribution,
    } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: phone',
      });
    }

    if (!isValidBdPhone(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid Bangladeshi phone number' });
    }

    const isPrepaid = paymentMethod === 'Paid' || paymentMethod === 'bKash';
    // Server-derived IP wins: req.body.ipAddress is client-supplied and this
    // value is sent to Meta as client_ip_address, a match key.
    let clientIp = getClientIp(req) || req.body.ipAddress;
    const normPhone = normalizePhoneNumber(phone);

    if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1') {
      const unfinished = await UnfinishedOrder.findOne({
        $or: [{ phone: phone }, { phone: normPhone }],
      });
      if (unfinished?.ipAddress) {
        clientIp = unfinished.ipAddress;
      }
    }

    let ipLocation = null;
    if (clientIp) {
      ipLocation = await getIpLocationIfEnabled(clientIp);
    }

    const slug = normalizeProductSlug(productSlug);
    const resolvedFlavour = FLAVOUR_MAP[flavour] || flavour || 'Dark Chocolate';

    // The price the browser sent is a display value only. The catalog decides
    // what this product actually costs on this landing page, and that is what
    // gets stored, charged and reported to Meta as the Purchase value.
    const { salePrice } = await Flavour.resolvePrice(resolvedFlavour, slug);
    if (Number(price) !== salePrice) {
      console.warn(
        `[Order] Price mismatch for ${slug}/${resolvedFlavour}: client sent ${price}, catalog says ${salePrice}. Using ${salePrice}.`
      );
    }

    const order = await Order.create({
      product: product || PRODUCT_NAMES[slug],
      productSlug: slug,
      customerName: customerName ? customerName.trim() : 'Customer',
      phone,
      alternativePhone: alternativePhone || '',
      email: email || '',
      district: district || '',
      thana: thana || '',
      address: address || '',
      flavour: resolvedFlavour,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: isPrepaid ? 'Paid' : 'COD',
      price: salePrice,
      transactionId: transactionId || '',
      screenshotUploaded: Boolean(screenshotUploaded),
      pageUrl: pageUrl || '',
      ipAddress: clientIp || '',
      ipLocation: ipLocation || {},
      userAgent: req.headers['user-agent'] || '',
      fbp: typeof fbp === 'string' ? fbp.slice(0, 200) : '',
      fbc: typeof fbc === 'string' ? fbc.slice(0, 500) : '',
      attribution: sanitizeAttribution(attribution),
      orderTime: orderTime ? new Date(orderTime) : new Date(),
      status: 'Pending',
    });

    // Asynchronously log/update IpTrack DB entry for this order's IP
    IpTrack.updateOne(
      { ip: clientIp },
      {
        $set: { lastSeen: new Date(), phone: normalizePhoneNumber(phone) },
        $inc: { count: 1 },
      },
      { upsert: true }
    ).catch((err) => console.error('[IpTrack Error] Failed to update IP log on order creation:', err));

    // Remove from UnfinishedOrder collection now that order is successfully completed!
    UnfinishedOrder.deleteMany({
      $or: [{ phone: phone }, { phone: normPhone }],
    }).catch((err) => console.error('[UnfinishedOrder] Clean up failed on order creation:', err.message));

    // Fire-and-forget: notification failures must not block order confirmation
    sendCustomerOrderSms(order).catch((err) =>
      console.error('[Customer SMS Exception]', err.message)
    );
    sendAdminOrderSms(order).catch((err) =>
      console.error('[Admin SMS Exception]', err.message)
    );
    sendAdminOrderEmail(order).catch((err) =>
      console.error('[Admin Email Exception]', err.message)
    );
    // Automatically query Steadfast Fraud Check for every new order in the background
    checkSteadfastFraud(order.phone)
      .then(async (fraudRes) => {
        if (fraudRes.success && fraudRes.data) {
          await Order.findByIdAndUpdate(order._id, { $set: { steadfastFraud: fraudRes.data } });
        }
      })
      .catch((err) => console.error('[Steadfast Fraud Check Error]', err.message));

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/orders/admin
 * @desc    Manually add an order from the admin dashboard (message-campaign
 *          sales). Created as Confirmed with source 'admin': no customer or
 *          admin notifications are sent, no browser/IP identifiers are stored,
 *          and the order is never reported to the Meta Conversions API.
 */
export async function createOrderAdmin(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Moderators are not permitted to create orders' });
    }

    const { customerName, phone, address, flavour, paymentMethod, transactionId, price } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Missing required field: phone' });
    }
    if (!isValidBdPhone(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid Bangladeshi phone number' });
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, error: 'Price must be a positive number' });
    }

    const isPrepaid = paymentMethod === 'Paid' || paymentMethod === 'bKash';
    const adminInfo = req.admin ? `${req.admin.name} (${req.admin.role || 'admin'})` : 'Admin';
    const normPhone = normalizePhoneNumber(phone);
    let clientIp = getClientIp(req) || req.body.ipAddress;

    const unfinished = await UnfinishedOrder.findOne({
      $or: [{ phone: phone }, { phone: normPhone }],
    });
    if (unfinished?.ipAddress && (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1')) {
      clientIp = unfinished.ipAddress;
    }

    const order = await Order.create({
      product: 'Milkimom Complete Dose',
      customerName: customerName ? String(customerName).trim() : 'Customer',
      phone,
      address: address || '',
      flavour: FLAVOUR_MAP[flavour] || flavour || 'Dark Chocolate',
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: isPrepaid ? 'Paid' : 'COD',
      price: priceNum,
      transactionId: transactionId || '',
      ipAddress: clientIp || '',
      orderTime: new Date(),
      status: 'Confirmed',
      source: 'admin',
      statusUpdatedBy: adminInfo,
      statusUpdatedAt: new Date(),
    });

    // The customer may have abandoned the web form before ordering via chat —
    // that unfinished record is resolved now.
    UnfinishedOrder.deleteMany({
      $or: [{ phone: phone }, { phone: normPhone }],
    }).catch((err) => console.error('[UnfinishedOrder] Clean up failed on manual order creation:', err.message));

    // Manual orders are born Confirmed, so they go straight to Steadfast too.
    sendOrderToSteadfast(order._id).catch((err) =>
      console.error('[Steadfast Exception]', err.message)
    );

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   GET /api/orders
 * @desc    List orders (newest first). Supports ?status=&phone=&page=&limit=
 */
export async function getOrders(req, res, next) {
  try {
    const { status, phone, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (phone) filter.phone = phone;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    // Asynchronously check Steadfast fraud status for any returned orders that haven't been checked yet
    const uncheckedOrders = orders.filter((o) => !o.steadfastFraud?.checkedAt);
    if (uncheckedOrders.length > 0) {
      Promise.allSettled(
        uncheckedOrders.map(async (o) => {
          const fraudRes = await checkSteadfastFraud(o.phone);
          if (fraudRes.success && fraudRes.data) {
            await Order.findByIdAndUpdate(o._id, { $set: { steadfastFraud: fraudRes.data } });
          }
        })
      ).catch(() => {});
    }

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   GET /api/orders/:id
 * @desc    Get a single order by id
 */
export async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 */
export async function updateOrderStatus(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Moderators are not permitted to change order status' });
    }

    const { status } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${allowed.join(', ')}`,
      });
    }

    const adminInfo = req.admin ? `${req.admin.name} (${req.admin.role || 'admin'})` : 'Admin';

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        statusUpdatedBy: adminInfo,
        statusUpdatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Confirming an order is an admin vouching that it is a real sale, so that
    // is the moment it becomes a Purchase for Meta. Report it once, ever —
    // fire-and-forget so the admin response never waits on the Graph API.
    if (PURCHASE_STATUSES.includes(status) && !order.metaPurchaseSentAt && order.source !== 'admin') {
      reportConfirmedPurchase(order).catch((err) =>
        console.error('[Meta CAPI Exception]', err.message)
      );
    }

    // Confirmed = ready to ship: auto-enter the parcel in the Steadfast
    // merchant account. Fire-and-forget — the admin response never waits on
    // the courier API, and sendOrderToSteadfast itself guards against
    // duplicate entries.
    if (status === 'Confirmed' && !order.steadfastConsignmentId) {
      sendOrderToSteadfast(order._id).catch((err) =>
        console.error('[Steadfast Exception]', err.message)
      );
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

/**
 * Reports a confirmed order to Meta as a Purchase.
 *
 * Claims the order's metaPurchaseSentAt flag atomically before sending, so
 * concurrent status updates can never double-report; releases the claim if
 * Meta rejects the event so the hourly retry sweep — or a later status change
 * — can try again. Exported for the Steadfast status-sync cron and the sweep.
 */
export async function reportConfirmedPurchase(order) {
  // Manual (admin-entered) orders came from message campaigns — the customer
  // already reached Meta through that channel, so never report them. Orders
  // created before the source field existed count as 'web'.
  if (order.source === 'admin') return false;

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, metaPurchaseSentAt: null },
    { $set: { metaPurchaseSentAt: new Date() } },
    { new: true }
  );
  if (!claimed) return false;

  const result = await sendMetaPurchase(claimed);

  if (result.sent) {
    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          metaPurchaseStatus: 'sent',
          metaPurchaseValue: result.value,
          metaPurchaseError: '',
        },
      }
    ).catch(() => {});
    return true;
  }

  // Release the claim so this order is picked up again.
  await Order.updateOne(
    { _id: order._id },
    {
      $set: {
        metaPurchaseSentAt: null,
        metaPurchaseStatus: 'failed',
        metaPurchaseError: String(result.error || 'Unknown error').slice(0, 500),
      },
    }
  ).catch(() => {});
  return false;
}

/**
 * Retries orders whose Purchase never reached Meta — a transient Graph API
 * failure used to lose that order's Purchase permanently. Meta rejects events
 * older than 7 days, so anything past that window is beyond saving.
 * Called hourly from the cron scheduler.
 */
export async function sweepUnreportedPurchases(limit = 50) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const pending = await Order.find({
    source: { $ne: 'admin' },
    status: { $in: PURCHASE_STATUSES },
    metaPurchaseSentAt: null,
    orderTime: { $gte: sevenDaysAgo },
  })
    .sort({ orderTime: 1 })
    .limit(limit);

  if (pending.length === 0) return { attempted: 0, sent: 0 };

  let sent = 0;
  for (const order of pending) {
    const ok = await reportConfirmedPurchase(order).catch((err) => {
      console.error(`[Meta CAPI Sweep] Order ${order._id} threw:`, err.message);
      return false;
    });
    if (ok) sent += 1;
  }

  console.log(`[Meta CAPI Sweep] Retried ${pending.length} unreported order(s), ${sent} sent.`);
  return { attempted: pending.length, sent };
}

/**
 * @route   PATCH /api/orders/:id/attribution
 * @desc    Public, fill-only: lets the thank-you page top up tracking
 *          identifiers that were not yet available when the order was posted.
 *          The Meta `_fbp` cookie in particular is written by fbevents.js
 *          (loaded afterInteractive), so a fast submit can beat it.
 *
 *          Deliberately narrow, since it is unauthenticated: the order must
 *          still be Pending and under 30 minutes old, only empty fields are
 *          written (never overwritten), and the whitelist is fbp/fbc plus the
 *          attribution subdocument. Price, status and PII are untouchable.
 */
export async function patchOrderAttribution(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).select(
      'status createdAt fbp fbc attribution'
    );
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const ageMs = Date.now() - new Date(order.createdAt).getTime();
    if (order.status !== 'Pending' || ageMs > 30 * 60 * 1000) {
      return res
        .status(409)
        .json({ success: false, error: 'Order is no longer accepting attribution updates' });
    }

    const { fbp, fbc, attribution } = req.body;
    const updates = {};

    if (!order.fbp && typeof fbp === 'string' && fbp.trim()) {
      updates.fbp = fbp.trim().slice(0, 200);
    }
    if (!order.fbc && typeof fbc === 'string' && fbc.trim()) {
      updates.fbc = fbc.trim().slice(0, 500);
    }

    const incoming = sanitizeAttribution(attribution);
    for (const [key, value] of Object.entries(incoming)) {
      if (!order.attribution?.[key]) updates[`attribution.${key}`] = value;
    }

    if (Object.keys(updates).length === 0) {
      return res.json({ success: true, data: { updated: false } });
    }

    await Order.updateOne({ _id: order._id }, { $set: updates });
    res.json({ success: true, data: { updated: true, fields: Object.keys(updates) } });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   PATCH /api/orders/:id
 * @desc    Update editable fields of an order (Customer Name, Location: address/thana/district, Flavour)
 */
export async function updateOrder(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Moderators are not permitted to edit order details' });
    }

    const { customerName, address, thana, district, flavour } = req.body;

    const updateData = {};
    if (customerName !== undefined) updateData.customerName = String(customerName).trim();
    if (address !== undefined) updateData.address = String(address).trim();
    if (thana !== undefined) updateData.thana = String(thana).trim();
    if (district !== undefined) updateData.district = String(district).trim();
    if (flavour !== undefined) updateData.flavour = String(flavour).trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update' });
    }

    if (req.admin) {
      updateData.statusUpdatedBy = `${req.admin.name} (${req.admin.role || 'admin'})`;
      updateData.statusUpdatedAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   DELETE /api/orders/bulk
 * @desc    Bulk delete orders (only cancelled orders allowed)
 */
export async function bulkDeleteOrders(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Only admins and superadmins can delete orders' });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No order IDs provided' });
    }

    const orders = await Order.find({ _id: { $in: ids } });
    if (orders.length === 0) {
      return res.status(404).json({ success: false, error: 'No matching orders found' });
    }

    const nonCancelled = orders.filter((o) => o.status !== 'Cancelled');
    if (nonCancelled.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Only cancelled orders can be deleted',
      });
    }

    const result = await Order.deleteMany({ _id: { $in: ids }, status: 'Cancelled' });
    res.json({ success: true, count: result.deletedCount });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete an order (only cancelled orders allowed)
 */
export async function deleteOrder(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Only admins and superadmins can delete orders' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Only cancelled orders can be deleted',
      });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/orders/:id/check-fraud
 * @desc    Fetch Steadfast Courier Fraud Check data for an order and store it
 */
export async function checkOrderFraud(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const fraudRes = await checkSteadfastFraud(order.phone);
    if (!fraudRes.success || !fraudRes.data) {
      const errorMsg = fraudRes.error || 'Failed to retrieve fraud data';
      await Order.findByIdAndUpdate(order._id, {
        $set: { 'steadfastFraud.error': errorMsg, 'steadfastFraud.checkedAt': new Date() },
      });
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const updated = await Order.findByIdAndUpdate(
      order._id,
      { $set: { steadfastFraud: { ...fraudRes.data, error: '' } } },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
