import UnfinishedOrder from '../models/UnfinishedOrder.js';
import Flavour from '../models/Flavour.js';
import { normalizePhoneNumber, isValidBdPhone } from '../utils/phone.js';
import { getClientIp } from './fraudController.js';
import { getIpLocationIfEnabled } from '../utils/ipinfo.js';

/**
 * @route   POST /api/unfinished-orders
 * @desc    Save or update an unfinished order when customer enters mobile/form details
 */
export async function saveUnfinishedOrder(req, res, next) {
  try {
    const { phone, customerName, district, thana, address, flavour, price } = req.body;

    if (!phone || !isValidBdPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Bangladeshi phone number',
      });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const clientIp = getClientIp(req);

    const productSlug = req.body.productSlug === 'smoothflow' ? 'smoothflow' : 'milkimom';
    const targetFlavour = flavour || 'Dark Chocolate';
    let targetPrice = Number(price);

    if (!targetPrice || targetPrice === 1200) {
      const { salePrice } = await Flavour.resolvePrice(targetFlavour, productSlug);
      targetPrice = salePrice;
    }

    let ipLocation = null;
    if (clientIp) {
      ipLocation = await getIpLocationIfEnabled(clientIp);
    }

    const updateFields = {
      customerName: customerName ? customerName.trim() : 'Customer',
      phone: normalizedPhone,
      district: district || '',
      thana: thana || '',
      address: address || '',
      flavour: targetFlavour,
      price: targetPrice,
      productSlug,
      ipAddress: clientIp,
      updatedAt: new Date(),
    };
    if (ipLocation) {
      updateFields.ipLocation = ipLocation;
    }

    const record = await UnfinishedOrder.findOneAndUpdate(
      { phone: normalizedPhone },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   GET /api/unfinished-orders
 * @desc    Get list of unfinished orders (admin protected)
 */
export async function getUnfinishedOrders(req, res, next) {
  try {
    const { status, phone, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (phone) filter.phone = { $regex: phone, $options: 'i' };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [rawOrders, total] = await Promise.all([
      UnfinishedOrder.find(filter)
        .sort({ updatedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      UnfinishedOrder.countDocuments(filter),
    ]);

    // Dynamically resolve product prices for returned unfinished orders
    const orders = await Promise.all(
      rawOrders.map(async (doc) => {
        const order = doc.toObject ? doc.toObject() : { ...doc };
        if (!order.price || order.price === 1200) {
          const { salePrice } = await Flavour.resolvePrice(order.flavour, order.productSlug);
          order.price = salePrice;
        }
        return order;
      })
    );

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   PATCH /api/unfinished-orders/:id/status
 * @desc    Update unfinished order status ('Pending', 'Called User', 'Cancelled', 'Spam')
 */
export async function updateUnfinishedOrderStatus(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Moderators are not permitted to change status' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const ALLOWED_STATUSES = ['Pending', 'Called User', 'Cancelled', 'Spam'];
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const adminInfo = req.admin ? `${req.admin.name} (${req.admin.role || 'admin'})` : 'Admin';

    const order = await UnfinishedOrder.findByIdAndUpdate(
      id,
      {
        status,
        statusUpdatedBy: adminInfo,
        statusUpdatedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Unfinished order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   DELETE /api/unfinished-orders/:id
 * @desc    Delete a single unfinished order
 */
export async function deleteUnfinishedOrder(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Only admins and superadmins can delete unfinished orders' });
    }

    const { id } = req.params;
    const order = await UnfinishedOrder.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Unfinished order not found' });
    }

    res.json({ success: true, message: 'Unfinished order deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/unfinished-orders/bulk-delete
 * @desc    Bulk delete unfinished orders by array of IDs
 */
export async function bulkDeleteUnfinishedOrders(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Only admins and superadmins can delete unfinished orders' });
    }

    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or empty "ids" array in request body',
      });
    }

    const result = await UnfinishedOrder.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} unfinished orders deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
}
