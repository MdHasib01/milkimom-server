import LandingPageTheme, { DEFAULT_THEMES } from '../models/LandingPageTheme.js';

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
 * @route   GET /api/customization/admin
 * @desc    Get all product landing page themes for Admin panel
 */
export async function getAdminThemes(req, res, next) {
  try {
    // Ensure default themes exist in DB
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
 * @route   POST /api/customization/admin
 * @desc    Create a new product landing page theme configuration
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

    res.status(201).json({
      success: true,
      data: theme,
    });
  } catch (err) {
    next(err);
  }
}
