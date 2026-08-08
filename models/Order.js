import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    product: {
      type: String,
      default: 'Milkimom Complete Dose',
      trim: true,
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
    flavour: {
      type: String,
      enum: ['Dark Chocolate', 'Vanilla', 'Cardamom', 'Cinnamon', 'ডার্ক চকলেট', 'ভ্যানিলা', 'এলাচ', 'দারুচিনি'],
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
    // Set once the delivered-order Purchase has been sent to Meta, so it is
    // never reported twice (e.g. status toggled away from and back to Delivered).
    metaPurchaseSentAt: {
      type: Date,
      default: null,
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
