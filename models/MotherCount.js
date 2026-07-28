import mongoose from 'mongoose';

const motherCountSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'satisfied_mothers',
      unique: true,
    },
    count: {
      type: Number,
      default: 89746,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    history: [
      {
        increment: Number,
        newCount: Number,
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

motherCountSchema.statics.getStats = async function () {
  let stats = await this.findOne({ key: 'satisfied_mothers' });
  if (!stats) {
    stats = await this.create({
      key: 'satisfied_mothers',
      count: 89746,
      lastUpdated: new Date(),
    });
  }
  return stats;
};

const MotherCount = mongoose.model('MotherCount', motherCountSchema);

export default MotherCount;
