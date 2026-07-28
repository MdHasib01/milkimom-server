import mongoose from 'mongoose';

const ipTrackSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    count: {
      type: Number,
      default: 1,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const IpTrack = mongoose.model('IpTrack', ipTrackSchema);

export default IpTrack;
