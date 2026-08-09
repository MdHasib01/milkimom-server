import Settings from '../models/Settings.js';
import { isValidBdPhone } from '../utils/phone.js';
import { getSteadfastBalance } from '../utils/steadfast.js';
import { fetchIpInfo } from '../utils/ipinfo.js';

/** Moderators are view-only — they see that a key exists, not the key itself. */
function maskKey(key) {
  if (!key) return '';
  if (key.length <= 4) return '••••';
  return `••••••••${key.slice(-4)}`;
}

/**
 * @route   GET /api/settings
 * @desc    Get global settings (admin email, admin mobile, Steadfast courier, ipinfo.io)
 */
export async function getSettings(req, res, next) {
  try {
    const settings = await Settings.getGlobal();
    const isModerator = req.admin && req.admin.role === 'moderator';
    res.json({
      success: true,
      data: {
        adminEmail: settings.adminEmail,
        adminMobile: settings.adminMobile,
        steadfastEnabled: settings.steadfastEnabled,
        steadfastApiKey: isModerator ? maskKey(settings.steadfastApiKey) : settings.steadfastApiKey,
        steadfastSecretKey: isModerator ? maskKey(settings.steadfastSecretKey) : settings.steadfastSecretKey,
        ipinfoEnabled: settings.ipinfoEnabled,
        ipinfoToken: isModerator ? maskKey(settings.ipinfoToken) : settings.ipinfoToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   PUT /api/settings
 * @desc    Update global settings
 */
export async function updateSettings(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Moderators are not permitted to edit or save settings' });
    }

    const {
      adminEmail,
      adminMobile,
      steadfastEnabled,
      steadfastApiKey,
      steadfastSecretKey,
      ipinfoEnabled,
      ipinfoToken,
    } = req.body;

    if (adminEmail !== undefined && adminEmail !== '' && !/^\S+@\S+\.\S+$/.test(adminEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid admin email address' });
    }
    if (adminMobile !== undefined && adminMobile !== '' && !isValidBdPhone(adminMobile)) {
      return res.status(400).json({ success: false, error: 'Invalid admin mobile number' });
    }

    const settings = await Settings.getGlobal();
    if (adminEmail !== undefined) settings.adminEmail = adminEmail;
    if (adminMobile !== undefined) settings.adminMobile = adminMobile;
    if (steadfastEnabled !== undefined) settings.steadfastEnabled = Boolean(steadfastEnabled);
    if (steadfastApiKey !== undefined) settings.steadfastApiKey = String(steadfastApiKey).trim();
    if (steadfastSecretKey !== undefined) settings.steadfastSecretKey = String(steadfastSecretKey).trim();
    if (ipinfoEnabled !== undefined) settings.ipinfoEnabled = Boolean(ipinfoEnabled);
    if (ipinfoToken !== undefined) settings.ipinfoToken = String(ipinfoToken).trim();

    if (settings.steadfastEnabled && (!settings.steadfastApiKey || !settings.steadfastSecretKey)) {
      return res.status(400).json({
        success: false,
        error: 'API Key and Secret Key are required to enable the Steadfast integration',
      });
    }

    await settings.save();

    res.json({
      success: true,
      data: {
        adminEmail: settings.adminEmail,
        adminMobile: settings.adminMobile,
        steadfastEnabled: settings.steadfastEnabled,
        steadfastApiKey: settings.steadfastApiKey,
        steadfastSecretKey: settings.steadfastSecretKey,
        ipinfoEnabled: settings.ipinfoEnabled,
        ipinfoToken: settings.ipinfoToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/settings/steadfast/test
 * @desc    Verify Steadfast credentials by fetching the merchant balance.
 */
export async function testSteadfastConnection(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Moderators are not permitted to test the Steadfast connection' });
    }

    let credentials = null;
    const { apiKey, secretKey } = req.body || {};
    if (apiKey && secretKey) {
      credentials = { apiKey: String(apiKey).trim(), secretKey: String(secretKey).trim() };
    } else {
      const settings = await Settings.getGlobal();
      if (settings.steadfastApiKey && settings.steadfastSecretKey) {
        credentials = { apiKey: settings.steadfastApiKey, secretKey: settings.steadfastSecretKey };
      }
    }

    if (!credentials) {
      return res.status(400).json({ success: false, error: 'No Steadfast API credentials provided or saved' });
    }

    const result = await getSteadfastBalance(credentials);
    if (!result.success) {
      return res.status(502).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: { balance: result.balance } });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/settings/ipinfo/test
 * @desc    Verify ipinfo.io API token by requesting caller IP location details
 */
export async function testIpinfoConnection(req, res, next) {
  try {
    if (req.admin && req.admin.role === 'moderator') {
      return res.status(403).json({ success: false, error: 'Moderators are not permitted to test ipinfo.io connection' });
    }

    let token = '';
    if (req.body && req.body.token !== undefined) {
      token = String(req.body.token).trim();
    } else {
      const settings = await Settings.getGlobal();
      token = settings.ipinfoToken;
    }

    const result = await fetchIpInfo('', token);
    if (!result.success) {
      return res.status(502).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   GET /api/settings/ipinfo/lookup/:ip
 * @desc    On-demand IP geolocation lookup using configured ipinfo.io integration
 */
export async function lookupIpLocation(req, res, next) {
  try {
    const { ip } = req.params;
    if (!ip) {
      return res.status(400).json({ success: false, error: 'IP address is required' });
    }

    const settings = await Settings.getGlobal();
    const result = await fetchIpInfo(ip, settings.ipinfoToken);
    if (!result.success) {
      return res.status(502).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    next(err);
  }
}

