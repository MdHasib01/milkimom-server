import { normalizePhoneNumber, maskPhoneNumber } from './phone.js';

// Memory store for OTP rate limiting: phone number -> array of send timestamps
const otpSendTracker = new Map();

/**
 * Basic rate limiting for OTP sends: max 3 sends per phone per 15 minutes.
 */
export function checkOtpRateLimit(phone) {
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1000;

  let timestamps = otpSendTracker.get(phone) || [];
  timestamps = timestamps.filter((ts) => ts > fifteenMinutesAgo);

  if (timestamps.length >= 3) {
    return false;
  }

  timestamps.push(now);
  otpSendTracker.set(phone, timestamps);
  return true;
}

/**
 * Sends an SMS via the BD Bulk SMS API.
 * Never returns or logs BD_SMS_TOKEN.
 */
export async function sendBdBulkSms(to, message, purpose = 'unknown') {
  const apiUrl = process.env.BD_SMS_API_URL || 'https://api.bdbulksms.net/api.php';
  const token = process.env.BD_SMS_TOKEN;

  if (!token || token === 'YOUR_API_TOKEN') {
    const errMsg = 'BD_SMS_TOKEN is not configured in environment variables';
    console.error(`[SMS Error] ${errMsg}`);
    return { success: false, providerResponse: null, error: errMsg };
  }

  const normalizedTo = normalizePhoneNumber(to);
  const maskedTo = maskPhoneNumber(normalizedTo);

  const params = new URLSearchParams();
  params.append('token', token);
  params.append('to', normalizedTo);
  params.append('message', message);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });

    const responseText = await response.text();
    clearTimeout(timeoutId);

    let providerResponse;
    try {
      providerResponse = JSON.parse(responseText);
    } catch {
      providerResponse = { raw: responseText };
    }

    const success =
      response.ok &&
      !responseText.toLowerCase().includes('error') &&
      !responseText.toLowerCase().includes('failed');

    console.log(`[SMS Request] Type: ${purpose}, Recipient: ${maskedTo}, Success: ${success}`);

    return {
      success,
      providerResponse,
      ...(success ? {} : { error: `SMS API returned failure: ${responseText}` }),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';
    const errMsg = isTimeout ? 'SMS request timed out after 10s' : error.message || 'Unknown network error';

    console.error(`[SMS Error] Recipient: ${maskedTo}, Error: ${errMsg}`);

    return { success: false, providerResponse: null, error: errMsg };
  }
}
