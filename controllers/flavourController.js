import Flavour, { DEFAULT_FLAVOURS } from '../models/Flavour.js';

function validateFlavourBody(body, { partial = false } = {}) {
  const { name, price, offerPrice, weight } = body;

  if (!partial || name !== undefined) {
    if (!name || !String(name).trim()) return 'Flavour name is required';
  }
  if (!partial || price !== undefined) {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) return 'Price must be a positive number';
  }
  if (offerPrice !== undefined && offerPrice !== null && offerPrice !== '') {
    const offerNum = Number(offerPrice);
    if (!Number.isFinite(offerNum) || offerNum < 0) return 'Offer price must be a non-negative number';
  }
  if (weight !== undefined && weight !== null && weight !== '') {
    const weightNum = Number(weight);
    if (!Number.isFinite(weightNum) || weightNum < 0) return 'Weight must be a non-negative number (KG)';
  }
  return null;
}

function pickFlavourFields(body) {
  const fields = {};
  if (body.name !== undefined) fields.name = String(body.name).trim();
  if (body.nameEn !== undefined) fields.nameEn = String(body.nameEn).trim();
  if (body.description !== undefined) fields.description = String(body.description).trim();
  if (body.price !== undefined) fields.price = Number(body.price);
  if (body.offerPrice !== undefined) {
    fields.offerPrice =
      body.offerPrice === null || body.offerPrice === '' ? null : Number(body.offerPrice);
  }
  if (body.weight !== undefined && body.weight !== null && body.weight !== '') {
    fields.weight = Number(body.weight);
  }
  if (body.invoiceCode !== undefined) fields.invoiceCode = String(body.invoiceCode).trim();
  if (body.tag !== undefined) fields.tag = String(body.tag).trim();
  if (body.active !== undefined) fields.active = Boolean(body.active);
  if (body.sortOrder !== undefined) fields.sortOrder = Number(body.sortOrder) || 0;
  return fields;
}

/**
 * @route   GET /api/flavours
 * @desc    Public: active flavours for the website order section. Serves the
 *          built-in defaults while none are configured.
 */
export async function getFlavours(req, res, next) {
  try {
    const flavours = await Flavour.getActiveOrDefaults();
    res.json({ success: true, data: flavours });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   GET /api/flavours/admin
 * @desc    Admin: full catalog including inactive flavours. Seeds the default
 *          flavours on first use so admins edit the live website content
 *          instead of starting from an empty list.
 */
export async function getFlavoursAdmin(req, res, next) {
  try {
    let flavours = await Flavour.find().sort({ sortOrder: 1, createdAt: 1 });
    if (flavours.length === 0) {
      await Flavour.insertMany(DEFAULT_FLAVOURS);
      flavours = await Flavour.find().sort({ sortOrder: 1, createdAt: 1 });
      console.log('[Flavour] Seeded default flavours into the catalog.');
    }
    res.json({ success: true, data: flavours });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/flavours
 * @desc    Admin: add a flavour/product.
 */
export async function createFlavour(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Moderators are not permitted to manage products' });
    }

    const error = validateFlavourBody(req.body);
    if (error) return res.status(400).json({ success: false, error });

    const flavour = await Flavour.create(pickFlavourFields(req.body));
    res.status(201).json({ success: true, data: flavour });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'A flavour with this name already exists' });
    }
    next(err);
  }
}

/**
 * @route   PATCH /api/flavours/:id
 * @desc    Admin: update a flavour/product.
 */
export async function updateFlavour(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Moderators are not permitted to manage products' });
    }

    const error = validateFlavourBody(req.body, { partial: true });
    if (error) return res.status(400).json({ success: false, error });

    const flavour = await Flavour.findByIdAndUpdate(
      req.params.id,
      { $set: pickFlavourFields(req.body) },
      { new: true, runValidators: true }
    );
    if (!flavour) {
      return res.status(404).json({ success: false, error: 'Flavour not found' });
    }
    res.json({ success: true, data: flavour });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'A flavour with this name already exists' });
    }
    next(err);
  }
}

/**
 * @route   DELETE /api/flavours/:id
 * @desc    Admin: remove a flavour/product. Existing orders keep their stored
 *          flavour string.
 */
export async function deleteFlavour(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Moderators are not permitted to manage products' });
    }

    const flavour = await Flavour.findByIdAndDelete(req.params.id);
    if (!flavour) {
      return res.status(404).json({ success: false, error: 'Flavour not found' });
    }
    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
}
