import crypto from 'crypto';

/**
 * Validates a provided room password against the expected room password
 * using timing-safe constant-time comparison to prevent timing side-channel attacks.
 */
export function validateRoomPassword(
  expectedPassword?: string | null,
  providedPassword?: string | null
): { valid: boolean; error?: 'password_required' | 'invalid_password' } {
  // If the room has no password set, validation always passes
  if (!expectedPassword || String(expectedPassword).trim().length === 0) {
    return { valid: true };
  }

  const normalizedExpected = String(expectedPassword).trim();
  const normalizedProvided = String(providedPassword || '').trim();

  if (!normalizedProvided) {
    return { valid: false, error: 'password_required' };
  }

  const bufExpected = Buffer.from(normalizedExpected, 'utf-8');
  const bufProvided = Buffer.from(normalizedProvided, 'utf-8');

  // Length mismatch fails immediately, but compare with dummy to maintain constant time execution
  if (bufExpected.length !== bufProvided.length) {
    // Perform dummy timingSafeEqual to avoid timing discrepancy on length
    crypto.timingSafeEqual(bufExpected, bufExpected);
    return { valid: false, error: 'invalid_password' };
  }

  const isMatch = crypto.timingSafeEqual(bufExpected, bufProvided);

  if (!isMatch) {
    return { valid: false, error: 'invalid_password' };
  }

  return { valid: true };
}
