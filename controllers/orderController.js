import Order from '../models/Order.js';
import Settings from '../models/Settings.js';
import { isValidBdPhone } from '../utils/phone.js';
import { sendAdminOrderEmail, sendCustomerOrderEmail } from '../utils/email.js';
import { sendBdBulkSms } from '../utils/sms.js';

/**
 * Sends a confirmation SMS to the customer when an order is created.
 * Never throws — order creation must not block if SMS fails.
 */
async function sendCustomerOrderSms(order) {
  try {
    if (!order.phone) return;

    const shortId = order._id ? order._id.toString().slice(-6) : '';
    const message = `প্রিয় ${order.customerName}, মিল্কিমম-এ আপনার অর্ডারটি গ্রহণ করা হয়েছে (অর্ডার ID: ${shortId})। ফ্লেভার: ${order.flavour}, মোট: ${order.price}/=। দ্রুত ডেলিভারি নিশ্চিত করতে আমাদের প্রতিনিধি যোগাযোগ করবেন।`;

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

    let message = `নতুন Milkimom অর্ডার\n\nনাম: ${order.customerName}\nফোন: ${order.phone}\nজেলা: ${order.district}\nথানা: ${order.thana}\nফ্লেভার: ${order.flavour}\nপেমেন্ট: ${order.paymentStatus === 'Paid' ? 'bKash' : 'Cash on Delivery'}`;
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

    const FLAVOUR_MAP = {
      'ডার্ক চকলেট': 'Dark Chocolate',
      'ভ্যানিলা': 'Vanilla',
      'এলাচ': 'Cardamom',
      'দারুচিনি': 'Cinnamon',
    };

    const isPrepaid = paymentMethod === 'Paid' || paymentMethod === 'bKash';

    const order = await Order.create({
      product: product || 'Milkimom Complete Dose',
      customerName: customerName ? customerName.trim() : 'Customer',
      phone,
      alternativePhone: alternativePhone || '',
      email: email || '',
      district: district || '',
      thana: thana || '',
      address: address || '',
      flavour: FLAVOUR_MAP[flavour] || flavour || 'Dark Chocolate',
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: isPrepaid ? 'Paid' : 'COD',
      price,
      transactionId: transactionId || '',
      screenshotUploaded: Boolean(screenshotUploaded),
      pageUrl: pageUrl || '',
      orderTime: orderTime ? new Date(orderTime) : new Date(),
      status: 'Pending',
    });

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
    if (order.email) {
      sendCustomerOrderEmail(order).catch((err) =>
        console.error('[Customer Email Exception]', err.message)
      );
    }

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
    const { status } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${allowed.join(', ')}`,
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
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
 * @route   DELETE /api/orders/:id
 * @desc    Delete an order
 */
export async function deleteOrder(req, res, next) {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
}
