/**
 * Normalizes Bangladeshi mobile numbers.
 * Accept: 017XXXXXXXX, 88017XXXXXXXX, +88017XXXXXXXX
 * Convert to: 8801XXXXXXXXX (13 digits)
 */
export function normalizePhoneNumber(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (clean.length === 11 && clean.startsWith('01')) {
    return '88' + clean;
  }
  if (clean.length === 13 && clean.startsWith('8801')) {
    return clean;
  }
  return clean;
}

/**
 * Masks phone number for safe logging.
 * Example: 8801712345678 -> 88017*****678
 */
export function maskPhoneNumber(phone) {
  const p = String(phone || '');
  if (p.length <= 6) return '******';
  return p.slice(0, 5) + '*****' + p.slice(-3);
}

/**
 * Validates a Bangladeshi mobile number in local 11-digit format (01XXXXXXXXX)
 * or normalized 13-digit format (8801XXXXXXXXX).
 */
export function isValidBdPhone(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  return (
    (clean.length === 11 && clean.startsWith('01')) ||
    (clean.length === 13 && clean.startsWith('8801'))
  );
}
