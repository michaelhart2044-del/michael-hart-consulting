import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const KEY_LEN = 64;
const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** Readable temporary password for first-time portal access (no ambiguous 0/O/1/l). */
export function generateTemporaryPassword(length = 12): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += TEMP_PASSWORD_CHARS[bytes[i] % TEMP_PASSWORD_CHARS.length];
  }
  return result;
}

export function isPasswordStrongEnough(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

export async function hashClientPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

export async function verifyClientPassword(password: string, stored: string): Promise<boolean> {
  if (!stored?.startsWith('scrypt:')) return false;
  const parts = stored.split(':');
  if (parts.length !== 3) return false;

  const salt = parts[1];
  const expectedHex = parts[2];
  try {
    const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}