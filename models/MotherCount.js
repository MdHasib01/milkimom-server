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

/**
 * One document per counter. Milkimom's lives under the original
 * 'satisfied_mothers' key; other products (e.g. MilkReady) get their own key
 * and start from their own seed count the first time they are read.
 */
motherCountSchema.statics.getStats = async function (key = 'satisfied_mothers', defaultCount = 89746) {
  let stats = await this.findOne({ key });
  if (!stats) {
    stats = await this.create({
      key,
      count: defaultCount,
      lastUpdated: new Date(),
    });
  }
  return stats;
};

const MotherCount = mongoose.model('MotherCount', motherCountSchema);

export default MotherCount;
