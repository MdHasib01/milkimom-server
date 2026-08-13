import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    product: {
      type: String,
      default: 'Milkimom Complete Dose',
      trim: true,
    },
    // Which landing page sold this order. The two landings sell different
    // products at different prices from one shared flavour catalog, so this is
    // what decides the authoritative price (Flavour.resolvePrice) and what the
    // Meta Purchase reports as content_ids.
    productSlug: {
      type: String,
      enum: ['milkimom', 'smoothflow'],
      default: 'milkimom',
      index: true,
    },
    customerName: {
      type: String,
      default: 'Customer',
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    alternativePhone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    district: {
      type: String,
      default: '',
      trim: true,
    },
    thana: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    // Free-form: flavours are a dynamic admin-managed catalog (Flavour model),
    // so no enum — orders keep whatever flavour name existed when placed.
    flavour: {
      type: String,
      trim: true,
      default: 'Dark Chocolate',
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'Cash on Delivery', 'Paid', 'bKash'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['COD', 'Paid'],
      default: 'COD',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },
    screenshotUploaded: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    // 'web' = customer placed it on the site; 'admin' = manually entered by an
    // admin (message-campaign sale). Admin orders are never reported to Meta.
    source: {
      type: String,
      enum: ['web', 'admin'],
      default: 'web',
      index: true,
    },
    pageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    // Geolocation captured via ipinfo.io
    ipLocation: {
      city: { type: String, default: '' },
      region: { type: String, default: '' },
      country: { type: String, default: '' },
      loc: { type: String, default: '' },
      org: { type: String, default: '' },
      postal: { type: String, default: '' },
      timezone: { type: String, default: '' },
    },
    // Browser identifiers captured at order time so the Meta Conversions API
    // Purchase (sent days later, on delivery) can be matched to the ad click.
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
    fbp: {
      type: String,
      trim: true,
      default: '',
    },
    fbc: {
      type: String,
      trim: true,
      default: '',
    },
    // Ad-click fingerprint captured on the *landing* page and carried through
    // to the order, so the Purchase (reported days later, on confirmation) can
    // still be attributed. fbp/fbc above are Meta's own cookies; these are the
    // raw click ids and campaign params, which also feed the Google Ads
    // offline-conversion export in the admin dashboard.
    attribution: {
      fbclid: { type: String, default: '', trim: true },
      gclid: { type: String, default: '', trim: true },
      gbraid: { type: String, default: '', trim: true },
      wbraid: { type: String, default: '', trim: true },
      ttclid: { type: String, default: '', trim: true },
      msclkid: { type: String, default: '', trim: true },
      utmSource: { type: String, default: '', trim: true },
      utmMedium: { type: String, default: '', trim: true },
      utmCampaign: { type: String, default: '', trim: true },
      utmTerm: { type: String, default: '', trim: true },
      utmContent: { type: String, default: '', trim: true },
      referrer: { type: String, default: '', trim: true },
      landingUrl: { type: String, default: '', trim: true },
      landingPath: { type: String, default: '', trim: true },
      // When the visitor first arrived. Used to rebuild `fbc` in Meta's
      // `fb.1.<click_time_ms>.<fbclid>` format with the real click time.
      firstSeenAt: { type: Date, default: null },
    },
    // Set once the Purchase has been sent to Meta, so it is never reported
    // twice (e.g. status walked Confirmed → Shipped → Delivered, or toggled
    // away from and back to Confirmed). Claimed atomically before sending and
    // released again if Meta rejects the event, so a retry can pick it up.
    metaPurchaseSentAt: {
      type: Date,
      default: null,
    },
    // Outcome of the last CAPI attempt, surfaced in the admin order drawer.
    metaPurchaseValue: {
      type: Number,
      default: null,
    },
    metaPurchaseStatus: {
      type: String,
      enum: ['', 'sent', 'failed'],
      default: '',
    },
    metaPurchaseError: {
      type: String,
      default: '',
      trim: true,
    },
    // Steadfast Courier consignment created automatically when the order is
    // Confirmed. consignmentId doubles as the "already sent" guard so the
    // entry is never duplicated (e.g. status toggled away from and back to
    // Confirmed). steadfastStatus holds the raw courier delivery status.
    steadfastConsignmentId: {
      type: String,
      default: '',
      index: true,
    },
    steadfastTrackingCode: {
      type: String,
      default: '',
    },
    steadfastStatus: {
      type: String,
      default: '',
    },
    steadfastSentAt: {
      type: Date,
      default: null,
    },
    steadfastLastSyncAt: {
      type: Date,
      default: null,
    },
    steadfastLastError: {
      type: String,
      default: '',
    },
    // Steadfast Fraud Check metrics (fetched via GET /fraud_check/:phone)
    steadfastFraud: {
      totalParcels: { type: Number, default: null },
      totalDelivered: { type: Number, default: null },
      totalCancelled: { type: Number, default: null },
      totalFraudReports: { type: Number, default: null },
      successRate: { type: Number, default: null },
      checkedAt: { type: Date, default: null },
      error: { type: String, default: '' },
    },
    orderTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    statusUpdatedBy: {
      type: String,
      default: '',
      trim: true,
    },
    statusUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
