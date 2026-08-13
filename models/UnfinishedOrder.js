import mongoose from 'mongoose';

const unfinishedOrderSchema = new mongoose.Schema(
  {
    product: {
      type: String,
      default: 'Milkimom Complete Dose',
      trim: true,
    },
    productSlug: {
      type: String,
      enum: ['milkimom', 'smoothflow'],
      default: 'milkimom',
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
      default: 'Dark Chocolate',
    },
    price: {
      type: Number,
      default: 4990,
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
    status: {
      type: String,
      enum: ['Pending', 'Called User', 'Cancelled', 'Spam'],
      default: 'Pending',
      index: true,
    },
    notes: {
      type: String,
      default: '',
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

const UnfinishedOrder = mongoose.model('UnfinishedOrder', unfinishedOrderSchema);

export default UnfinishedOrder;
