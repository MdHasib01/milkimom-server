import mongoose from 'mongoose';

// Singleton settings document (key is always 'global').
const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
    },
    adminEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    adminMobile: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

settingsSchema.statics.getGlobal = async function () {
  let settings = await this.findOne({ key: 'global' });
  if (!settings) {
    settings = await this.create({
      key: 'global',
      adminEmail: process.env.ADMIN_EMAIL || '',
      adminMobile: process.env.ADMIN_PHONE || '',
    });
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
