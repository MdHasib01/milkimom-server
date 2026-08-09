import Settings from '../models/Settings.js';

/**
 * Checks if an IP address is a private/local/loopback IP.
 */
function isLocalIp(ip) {
  if (!ip) return true;
  const cleanIp = ip.replace(/^::ffff:/, '').trim();
  return (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp === 'localhost' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)
  );
}

/**
 * Fetches geolocation information for an IP address directly from ipinfo.io
 * @param {string} ip - IP address to look up (if omitted or 'me', fetches caller's IP)
 * @param {string} [token] - Optional ipinfo.io access token/API key
 */
export async function fetchIpInfo(ip, token = '') {
  try {
    const targetIp = (ip || '').trim();

    if (isLocalIp(targetIp)) {
      return {
        success: true,
        data: {
          ip: targetIp || '127.0.0.1',
          city: 'Local Host',
          region: 'Local Network',
          country: 'LOCAL',
          loc: '',
          org: 'Internal / Loopback IP',
          postal: '',
          timezone: '',
        },
      };
    }

    const cleanToken = (token || '').trim();
    let url = `https://ipinfo.io/${encodeURIComponent(targetIp)}?token=${encodeURIComponent(cleanToken)}`;
    if (!cleanToken) {
      url = `https://ipinfo.io/${encodeURIComponent(targetIp)}/json`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Milkimom-Server/2.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `ipinfo.io API returned HTTP status ${response.status}: ${errText.slice(0, 100)}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        ip: data.ip || targetIp,
        city: data.city || '',
        region: data.region || '',
        country: data.country || '',
        loc: data.loc || '',
        org: data.org || '',
        postal: data.postal || '',
        timezone: data.timezone || '',
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'ipinfo.io lookup timed out' : err.message,
    };
  }
}

/**
 * Convenience helper to fetch geolocation if ipinfo integration is enabled in Settings.
 * Safe for background/non-blocking calls — never throws.
 */
export async function getIpLocationIfEnabled(ip) {
  try {
    if (!ip || isLocalIp(ip)) {
      if (isLocalIp(ip)) {
        return {
          city: 'Local Host',
          region: 'Local Network',
          country: 'LOCAL',
          loc: '',
          org: 'Internal / Loopback IP',
        };
      }
      return null;
    }

    const settings = await Settings.getGlobal();
    if (!settings || !settings.ipinfoEnabled) {
      return null;
    }

    const result = await fetchIpInfo(ip, settings.ipinfoToken);
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  } catch (err) {
    console.error('[ipinfo] Location lookup error:', err.message);
    return null;
  }
}
