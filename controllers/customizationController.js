import LandingPageTheme, { DEFAULT_THEMES } from '../models/LandingPageTheme.js';
import LandingPageContent, { DEFAULT_CONTENTS } from '../models/LandingPageContent.js';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

function isValidHexColor(color) {
  return typeof color === 'string' && HEX_COLOR_REGEX.test(color.trim());
}

/**
 * @route   GET /api/customization/public/:slug?
 * @desc    Get public landing page theme color settings by product slug (default: milkimom)
 */
export async function getPublicTheme(req, res, next) {
  try {
    const slug = req.params.slug || req.query.product || 'milkimom';
    const theme = await LandingPageTheme.getThemeBySlug(slug);
    res.json({
      success: true,
      data: theme,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   GET /api/customization/content/public/:slug?
 * @desc    Get public landing page section content by product slug
 */
export async function getPublicContent(req, res, next) {
  try {
    const slug = req.params.slug || req.query.product || 'milkimom';
    const content = await LandingPageContent.getContentBySlug(slug);
    res.json({
      success: true,
      data: content,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   GET /api/customization/admin
 * @desc    Get all product landing page themes for Admin panel
 */
export async function getAdminThemes(req, res, next) {
  try {
    await LandingPageTheme.getThemeBySlug('milkimom');
    await LandingPageTheme.getThemeBySlug('smoothflow');

    const themes = await LandingPageTheme.find().sort({ productSlug: 1 });
    res.json({
      success: true,
      data: themes,
      defaultPresets: DEFAULT_THEMES,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   GET /api/customization/content/admin/:slug?
 * @desc    Get section content for a product landing page in Admin panel
 */
export async function getAdminContent(req, res, next) {
  try {
    const slug = req.params.slug || 'milkimom';
    const content = await LandingPageContent.getContentBySlug(slug);
    res.json({
      success: true,
      data: content,
      defaultPresets: DEFAULT_CONTENTS[slug] || DEFAULT_CONTENTS.milkimom,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   PUT /api/customization/admin/:slug
 * @desc    Update theme colors for a specific product landing page
 */
export async function updateAdminTheme(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({
        success: false,
        error: 'Moderators are not permitted to edit theme colors',
      });
    }

    const { slug } = req.params;
    const normalizedSlug = String(slug).toLowerCase().trim();

    const { name, themeColor, accentColor, ctaColor, ctaTextColor, backgroundColor } = req.body;

    if (themeColor && !isValidHexColor(themeColor)) {
      return res.status(400).json({ success: false, error: 'Invalid hex color for Theme Color' });
    }
    if (accentColor && !isValidHexColor(accentColor)) {
      return res.status(400).json({ success: false, error: 'Invalid hex color for Accent Color' });
    }
    if (ctaColor && !isValidHexColor(ctaColor)) {
      return res.status(400).json({ success: false, error: 'Invalid hex color for CTA Button Color' });
    }
    if (ctaTextColor && !isValidHexColor(ctaTextColor)) {
      return res.status(400).json({ success: false, error: 'Invalid hex color for CTA Text Color' });
    }
    if (backgroundColor && !isValidHexColor(backgroundColor)) {
      return res.status(400).json({ success: false, error: 'Invalid hex color for Background Color' });
    }

    let theme = await LandingPageTheme.findOne({ productSlug: normalizedSlug });
    if (!theme) {
      theme = await LandingPageTheme.getThemeBySlug(normalizedSlug);
    }

    if (name !== undefined) theme.name = String(name).trim();
    if (themeColor !== undefined) theme.themeColor = String(themeColor).trim();
    if (accentColor !== undefined) theme.accentColor = String(accentColor).trim();
    if (ctaColor !== undefined) theme.ctaColor = String(ctaColor).trim();
    if (ctaTextColor !== undefined) theme.ctaTextColor = String(ctaTextColor).trim();
    if (backgroundColor !== undefined) theme.backgroundColor = String(backgroundColor).trim();

    await theme.save();

    res.json({
      success: true,
      data: theme,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   PUT /api/customization/content/admin/:slug
 * @desc    Update section content for a specific product landing page
 */
export async function updateAdminContent(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({
        success: false,
        error: 'Moderators are not permitted to edit section content',
      });
    }

    const { slug } = req.params;
    const normalizedSlug = String(slug).toLowerCase().trim();

    let content = await LandingPageContent.findOne({ productSlug: normalizedSlug });
    if (!content) {
      content = await LandingPageContent.getContentBySlug(normalizedSlug);
    }

    const fields = [
      'logoType',
      'logoImage',
      'announcementText',
      'heroBadge',
      'heroTitle',
      'heroTitleHighlight',
      'heroSubtitle',
      'heroSubtitleHighlight',
      'heroCtaText',
      'heroImage',
      'doctorTitle',
      'doctorName',
      'doctorDegree',
      'doctorQuote',
      'doctorImage',
      'orderHeadline',
      'orderSubheadline',
      'guaranteeTitle',
      'guaranteeText',
      'footerText',
      'footerPhone',
      'footerEmail',
      'footerAddress',
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        content[field] = String(req.body[field]).trim();
      }
    }

    if (req.body.productName !== undefined) content.productName = String(req.body.productName).trim();
    if (req.body.productNameEn !== undefined) content.productNameEn = String(req.body.productNameEn).trim();
    if (req.body.carouselItems !== undefined) {
      content.carouselItems = Array.isArray(req.body.carouselItems) ? req.body.carouselItems : [];
    }
    if (req.body.doctorItems !== undefined) {
      content.doctorItems = Array.isArray(req.body.doctorItems) ? req.body.doctorItems : [];
    }

    await content.save();

    res.json({
      success: true,
      data: content,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/customization/admin/:slug/reset
 * @desc    Reset theme colors for a specific product landing page back to default palette
 */
export async function resetAdminTheme(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({
        success: false,
        error: 'Moderators are not permitted to reset theme colors',
      });
    }

    const { slug } = req.params;
    const theme = await LandingPageTheme.resetThemeToDefault(slug);

    res.json({
      success: true,
      message: `Theme colors for "${theme.name}" reset to default successfully`,
      data: theme,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/customization/content/admin/:slug/reset
 * @desc    Reset section content for a specific product landing page back to default content
 */
export async function resetAdminContent(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({
        success: false,
        error: 'Moderators are not permitted to reset section content',
      });
    }

    const { slug } = req.params;
    const content = await LandingPageContent.resetContentToDefault(slug);

    res.json({
      success: true,
      message: `Section content reset to default successfully`,
      data: content,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/customization/admin
 * @desc    Create a new product landing page theme & content configuration
 */
export async function createAdminTheme(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({
        success: false,
        error: 'Moderators are not permitted to create theme colors',
      });
    }

    const { productSlug, name, themeColor, accentColor, ctaColor, ctaTextColor, backgroundColor } = req.body;

    if (!productSlug || !String(productSlug).trim()) {
      return res.status(400).json({ success: false, error: 'Product slug is required' });
    }

    const normalizedSlug = String(productSlug).toLowerCase().trim();

    const existing = await LandingPageTheme.findOne({ productSlug: normalizedSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Theme configuration for slug "${normalizedSlug}" already exists`,
      });
    }

    const defaultBase = DEFAULT_THEMES[normalizedSlug] || DEFAULT_THEMES.milkimom;

    const theme = await LandingPageTheme.create({
      productSlug: normalizedSlug,
      name: name ? String(name).trim() : normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1) + ' Landing',
      themeColor: isValidHexColor(themeColor) ? themeColor.trim() : defaultBase.themeColor,
      accentColor: isValidHexColor(accentColor) ? accentColor.trim() : defaultBase.accentColor,
      ctaColor: isValidHexColor(ctaColor) ? ctaColor.trim() : defaultBase.ctaColor,
      ctaTextColor: isValidHexColor(ctaTextColor) ? ctaTextColor.trim() : defaultBase.ctaTextColor,
      backgroundColor: isValidHexColor(backgroundColor) ? backgroundColor.trim() : defaultBase.backgroundColor,
    });

    // Also initialize section content
    await LandingPageContent.getContentBySlug(normalizedSlug);

    res.status(201).json({
      success: true,
      data: theme,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/customization/upload/:slug
 * @desc    Upload image asset directly to server uploads folder per product landing page
 */
export async function uploadImageAsset(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({
        success: false,
        error: 'Moderators are not permitted to upload image assets',
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const slug = req.params.slug || 'milkimom';
    const normalizedSlug = String(slug).toLowerCase().trim();
    const relativeUrl = `/uploads/${normalizedSlug}/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully to server asset folder',
      url: relativeUrl,
      filename: req.file.filename,
    });
  } catch (err) {
    next(err);
  }
}
