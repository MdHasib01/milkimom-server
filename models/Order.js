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
