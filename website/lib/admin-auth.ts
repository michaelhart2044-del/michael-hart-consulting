import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Minimal, secure admin authentication using httpOnly signed cookies.
 * - No external auth provider.
 * - Single shared password (set via ADMIN_PASSWORD env).
 * - Signed with ADMIN_COOKIE_SECRET (separate long random secret).
 * - 12-hour sessions.
 *
 * Requirements (set in Vercel dashboard + local .env):
 *   ADMIN_PASSWORD=your_strong_unique_password
 *   ADMIN_COOKIE_SECRET=at-least-32-char-random-string (use: openssl rand -base64 32)
 *
 * All sensitive operations are private / never logged.
 */

const COOKIE_NAME = 'mh_admin';
const SESSION_HOURS = 12;

function getSecrets() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!password || !secret) {
    // In production this must be set — we treat missing secrets as hard failure for admin.
    return null;
  }
  return { password, secret };
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function verifySignature(payload: string, sig: string, secret: string): boolean {
  const expected = sign(payload, secret);
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(sig, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function createAdminSession(): Promise<string | null> {
  const secrets = getSecrets();
  if (!secrets) return null;

  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `admin:${exp}`;
  const sig = sign(payload, secrets.secret);
  return `${payload}:${sig}`;
}

export async function verifyAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secrets = getSecrets();
  if (!secrets) return false;

  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const payload = `${parts[0]}:${parts[1]}`;
  const sig = parts[2];
  const exp = Number(parts[1]);

  if (!exp || Date.now() > exp) return false;
  if (parts[0] !== 'admin') return false;

  return verifySignature(payload, sig, secrets.secret);
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getAdminSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
