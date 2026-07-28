import mongoose from 'mongoose';

const unfinishedOrderSchema = new mongoose.Schema(
  {
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
      default: 1200,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
      index: true,
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
  },
  {
    timestamps: true,
  }
);

const UnfinishedOrder = mongoose.model('UnfinishedOrder', unfinishedOrderSchema);

export default UnfinishedOrder;
