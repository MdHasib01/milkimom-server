import mongoose from 'mongoose';

// Predefined default palettes for known landing pages
export const DEFAULT_THEMES = {
  milkimom: {
    productSlug: 'milkimom',
    name: 'Milkimom (Main Landing)',
    themeColor: '#bd0052',       // Brand Crimson
    accentColor: '#e37a69',      // Brand Coral
    ctaColor: '#ffd666',         // Brand CTA Yellow/Gold
    ctaTextColor: '#3a2600',     // Brand CTA Dark Text
    backgroundColor: '#fff9f6',  // Brand Cream
  },
  smoothflow: {
    productSlug: 'smoothflow',
    name: 'SmoothFlow Landing',
    themeColor: '#0284c7',       // Ocean Blue
    accentColor: '#38bdf8',      // Sky Blue
    ctaColor: '#f59e0b',         // Warm Amber CTA
    ctaTextColor: '#1e293b',     // Dark Slate
    backgroundColor: '#f0f9ff',  // Soft Cyan Light
  },
};

const landingPageThemeSchema = new mongoose.Schema(
  {
    productSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    themeColor: {
      type: String,
      required: true,
      trim: true,
      default: '#bd0052',
    },
    accentColor: {
      type: String,
      required: true,
      trim: true,
      default: '#e37a69',
    },
    ctaColor: {
      type: String,
      required: true,
      trim: true,
      default: '#ffd666',
    },
    ctaTextColor: {
      type: String,
      required: true,
      trim: true,
      default: '#3a2600',
    },
    backgroundColor: {
      type: String,
      required: true,
      trim: true,
      default: '#fff9f6',
    },
  },
  {
    timestamps: true,
  }
);

// Get theme settings by product slug, fallback to default palette or milkimom default
landingPageThemeSchema.statics.getThemeBySlug = async function (slug = 'milkimom') {
  const normalizedSlug = String(slug).toLowerCase().trim();
  let theme = await this.findOne({ productSlug: normalizedSlug });

  if (!theme) {
    const defaultData = DEFAULT_THEMES[normalizedSlug] || {
      productSlug: normalizedSlug,
      name: normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1) + ' Landing',
      ...DEFAULT_THEMES.milkimom,
    };

    theme = await this.create({
      productSlug: normalizedSlug,
      name: defaultData.name,
      themeColor: defaultData.themeColor,
      accentColor: defaultData.accentColor,
      ctaColor: defaultData.ctaColor,
      ctaTextColor: defaultData.ctaTextColor,
      backgroundColor: defaultData.backgroundColor,
    });
  }

  return theme;
};

// Reset theme settings for a product slug back to default
landingPageThemeSchema.statics.resetThemeToDefault = async function (slug = 'milkimom') {
  const normalizedSlug = String(slug).toLowerCase().trim();
  const defaultData = DEFAULT_THEMES[normalizedSlug] || {
    productSlug: normalizedSlug,
    name: normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1) + ' Landing',
    themeColor: DEFAULT_THEMES.milkimom.themeColor,
    accentColor: DEFAULT_THEMES.milkimom.accentColor,
    ctaColor: DEFAULT_THEMES.milkimom.ctaColor,
    ctaTextColor: DEFAULT_THEMES.milkimom.ctaTextColor,
    backgroundColor: DEFAULT_THEMES.milkimom.backgroundColor,
  };

  const theme = await this.findOneAndUpdate(
    { productSlug: normalizedSlug },
    {
      $set: {
        name: defaultData.name,
        themeColor: defaultData.themeColor,
        accentColor: defaultData.accentColor,
        ctaColor: defaultData.ctaColor,
        ctaTextColor: defaultData.ctaTextColor,
        backgroundColor: defaultData.backgroundColor,
      },
    },
    { new: true, upsert: true }
  );

  return theme;
};

const LandingPageTheme = mongoose.model('LandingPageTheme', landingPageThemeSchema);

export default LandingPageTheme;
