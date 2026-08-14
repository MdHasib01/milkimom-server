import mongoose from 'mongoose';

/**
 * Dynamic flavour/product catalog, managed from the admin dashboard
 * (Settings → Products tab). The website order section renders these cards;
 * weight and invoiceCode feed the Steadfast consignment entry.
 *
 * DEFAULT_FLAVOURS mirrors the original hardcoded website content and is the
 * mandatory fallback: served while the collection is empty and auto-seeded
 * the first time an admin opens the Products tab.
 */
const flavourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Flavour name is required'],
      trim: true,
      unique: true,
    },
    // English name stored on orders (order.flavour) and sent to Steadfast.
    nameEn: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Regular price is required'],
      min: 0,
    },
    // Discounted price shown on the site; the customer pays this when set.
    offerPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    // The SmoothFlow landing (/smoothflow) sells a different product at a
    // different price from the same flavour catalog. These two fields hold that
    // product's prices; null falls back to SMOOTHFLOW_FALLBACK_PRICE below.
    // Before these existed the site guessed SmoothFlow's price with
    // `salePrice === 4990 ? 1999 : salePrice`, so any Milkimom price edit
    // silently made SmoothFlow sell at the Milkimom price.
    smoothflowPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    smoothflowOfferPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    // Parcel weight in KG for the Steadfast consignment.
    weight: {
      type: Number,
      default: 0.5,
      min: 0,
    },
    // Optional prefix for the Steadfast invoice, e.g. "MM-DC" produces
    // invoice "MM-DC-<orderId>". Empty = plain order id.
    invoiceCode: {
      type: String,
      trim: true,
      default: '',
    },
    // Badge shown on the flavour card, e.g. "সবচেয়ে জনপ্রিয়".
    tag: {
      type: String,
      trim: true,
      default: '',
    },
    // Standard product image URL
    image: {
      type: String,
      trim: true,
      default: '',
    },
    // SmoothFlow variant product image URL
    smoothflowImage: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const DEFAULT_FLAVOURS = [
  {
    name: 'ডার্ক চকলেট',
    nameEn: 'Dark Chocolate',
    description: 'রিচ, গভীর ও চকলেটি মজায় ভরপুর',
    price: 8990,
    offerPrice: 4990,
    smoothflowPrice: 3450,
    smoothflowOfferPrice: 1999,
    weight: 0.5,
    invoiceCode: '',
    tag: 'সবচেয়ে জনপ্রিয়',
    active: true,
    sortOrder: 0,
  },
  {
    name: 'ভ্যানিলা',
    nameEn: 'Vanilla',
    description: 'মিষ্টি, স্মুথ ও ভ্যানিলার মধুর ছোঁয়ায়',
    price: 8990,
    offerPrice: 4990,
    smoothflowPrice: 3450,
    smoothflowOfferPrice: 1999,
    weight: 0.5,
    invoiceCode: '',
    tag: '',
    active: true,
    sortOrder: 1,
  },
  {
    name: 'কার্ডামম (এলাচ)',
    nameEn: 'Cardamom',
    description: 'এলাচের ঘ্রাণে এক অনন্য মজার স্বাদ',
    price: 8990,
    offerPrice: 4990,
    smoothflowPrice: 3450,
    smoothflowOfferPrice: 1999,
    weight: 0.5,
    invoiceCode: '',
    tag: '',
    active: true,
    sortOrder: 2,
  },
  {
    name: 'সিনামন (দারুচিনি)',
    nameEn: 'Cinnamon',
    description: 'দারুচিনির উষ্ণতা, স্বাদে করে তোলে আরও স্পেশাল',
    price: 8990,
    offerPrice: 4990,
    smoothflowPrice: 3450,
    smoothflowOfferPrice: 1999,
    weight: 0.5,
    invoiceCode: '',
    tag: '',
    active: true,
    sortOrder: 3,
  },
];

/**
 * Active flavours for the public site, sorted for display. Falls back to
 * DEFAULT_FLAVOURS when the collection is empty or the query fails, so the
 * order form always has products to sell.
 */
flavourSchema.statics.getActiveOrDefaults = async function () {
  try {
    const flavours = await this.find({ active: true }).sort({ sortOrder: 1, createdAt: 1 });
    if (flavours.length > 0) return flavours;
  } catch (err) {
    console.warn('[Flavour] Falling back to default flavours:', err.message);
  }
  return DEFAULT_FLAVOURS;
};

/**
 * Bangla/English name pairs for flavours as they have been stored on orders
 * over time. An order placed before a product was renamed — or one that saved
 * the English name while the catalog entry only has the Bangla one — still has
 * to resolve to its catalog record, otherwise the configured weight and
 * invoice code silently fall back to the defaults.
 */
const NAME_ALIASES = [
  ['ডার্ক চকলেট', 'Dark Chocolate'],
  ['ভ্যানিলা', 'Vanilla'],
  ['কার্ডামম (এলাচ)', 'এলাচ', 'Cardamom'],
  ['সিনামন (দারুচিনি)', 'দারুচিনি', 'Cinnamon'],
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Every name this flavour might be stored under, including its alias partners. */
function nameCandidates(name) {
  const lower = name.toLowerCase();
  const candidates = new Set([name]);

  const groups = [
    ...NAME_ALIASES,
    ...DEFAULT_FLAVOURS.map((f) => [f.name, f.nameEn].filter(Boolean)),
  ];
  for (const group of groups) {
    if (group.some((n) => n.toLowerCase() === lower)) {
      group.forEach((n) => candidates.add(n));
    }
  }

  return [...candidates];
}

/**
 * Finds the flavour matching an order's stored flavour string, tolerating
 * case, surrounding whitespace and Bangla/English naming. Checks the DB first
 * and the built-in defaults as fallback; returns null when nothing matches.
 */
flavourSchema.statics.findByOrderFlavour = async function (flavourName) {
  const name = String(flavourName || '').trim();
  if (!name) return null;

  const candidates = nameCandidates(name);
  const patterns = candidates.map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i'));

  try {
    const flavour = await this.findOne({
      $or: [{ name: { $in: patterns } }, { nameEn: { $in: patterns } }],
    });
    if (flavour) return flavour;
    console.warn(
      `[Flavour] No catalog product matches order flavour "${name}" — falling back to built-in defaults (weight/invoice code from Settings → Products will not apply).`
    );
  } catch (err) {
    console.warn('[Flavour] Lookup failed, checking defaults:', err.message);
  }

  const lowered = candidates.map((c) => c.toLowerCase());
  return (
    DEFAULT_FLAVOURS.find(
      (f) =>
        lowered.includes(f.name.toLowerCase()) ||
        (f.nameEn && lowered.includes(f.nameEn.toLowerCase()))
    ) || null
  );
};

/**
 * Prices used when the catalog has no per-product figure — the same constants
 * the landing pages fall back to (client/src/lib/content.ts).
 */
export const FALLBACK_PRICES = {
  milkimom: { regularPrice: 8990, salePrice: 4990 },
  smoothflow: { regularPrice: 3450, salePrice: 1999 },
  milkready: { regularPrice: 5650, salePrice: 3399 },
};

/** A usable price is a finite number greater than zero. */
function usablePrice(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * The authoritative price for a flavour on a given landing page. The browser
 * sends a price with every order, but it is only ever a display value — this
 * is what actually gets charged, stored and reported to Meta as the Purchase
 * value, so the two landings can never report each other's price.
 *
 * Returns { regularPrice, salePrice }; salePrice is what the customer pays.
 */
flavourSchema.statics.resolvePrice = async function (flavourName, productSlug) {
  const s = String(productSlug || '').toLowerCase().trim();
  const slug = s === 'smoothflow' ? 'smoothflow' : s === 'milkready' ? 'milkready' : 'milkimom';
  const fallback = FALLBACK_PRICES[slug];

  if (slug === 'milkready') {
    return { regularPrice: 5650, salePrice: 3399 };
  }

  const flavour = await this.findByOrderFlavour(flavourName).catch(() => null);
  if (!flavour) return { ...fallback };

  const regular =
    slug === 'smoothflow'
      ? usablePrice(flavour.smoothflowPrice)
      : usablePrice(flavour.price);
  const offer =
    slug === 'smoothflow'
      ? usablePrice(flavour.smoothflowOfferPrice)
      : usablePrice(flavour.offerPrice);

  const regularPrice = regular ?? fallback.regularPrice;
  // An offer above the regular price is a data-entry mistake, not a discount.
  const salePrice =
    offer && offer < regularPrice
      ? offer
      : slug === 'smoothflow'
      ? fallback.salePrice
      : regularPrice;

  return { regularPrice, salePrice };
};

const Flavour = mongoose.model('Flavour', flavourSchema);

export default Flavour;
