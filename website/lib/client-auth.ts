import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Simple client auth for the private portal using httpOnly signed cookies and magic links.
 * Reuses patterns from admin-auth but scoped to clients (email from submissions).
 * Magic links sent via existing Resend (no new deps).
 * Sessions expire after 30 days for convenience.
 *
 * Security: httpOnly, secure in prod, sameSite lax, signed with CLIENT_COOKIE_SECRET.
 * Clients identified by email (from their prep submission).
 */

const COOKIE_NAME = 'mh_client';
const SESSION_DAYS = 30;

function getSecrets() {
  const secret = process.env.CLIENT_COOKIE_SECRET || process.env.ADMIN_COOKIE_SECRET;
  if (!secret) {
    return null;
  }
  return { secret };
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

export async function createClientMagicToken(email: string): Promise<string | null> {
  const secrets = getSecrets();
  if (!secrets) return null;

  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `client:${email.toLowerCase()}:${exp}`;
  const sig = sign(payload, secrets.secret);
  return `${payload}:${sig}`;
}

export async function verifyClientMagicToken(token: string): Promise<string | null> {
  console.log('DEBUG verifyClientMagicToken: called with token (truncated):', token ? token.substring(0, 80) + '...' : null);
  if (!token) {
    console.log('DEBUG verify: no token');
    return null;
  }
  const secrets = getSecrets();
  if (!secrets) {
    console.log('DEBUG verify: no secrets');
    return null;
  }

  const parts = token.split(':');
  console.log('DEBUG verify: parts.length =', parts.length);
  if (parts.length !== 4) {
    console.log('DEBUG verify: wrong parts length');
    return null; // client:email:exp:sig
  }

  const payload = `${parts[0]}:${parts[1]}:${parts[2]}`;
  const sig = parts[3];
  const exp = Number(parts[2]);
  const email = parts[1];

  console.log('DEBUG verify: exp=', exp, 'now=', Date.now(), 'expired=', (!exp || Date.now() > exp));
  if (!exp || Date.now() > exp) {
    console.log('DEBUG verify: expired');
    return null;
  }
  console.log('DEBUG verify: parts[0]=', parts[0], 'email=', email);
  if (parts[0] !== 'client' || !email) {
    console.log('DEBUG verify: bad prefix or email');
    return null;
  }

  const sigValid = verifySignature(payload, sig, secrets.secret);
  console.log('DEBUG verify: sigValid=', sigValid, 'payload (truncated)=', payload.substring(0,50), 'sig (truncated)=', sig.substring(0,20));
  if (!sigValid) {
    console.log('DEBUG verify: signature mismatch');
    return null;
  }

  console.log('DEBUG verify: success for email=', email.toLowerCase());
  return email.toLowerCase();
}

export async function setClientCookie(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearClientCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getClientSessionEmail(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value?.toLowerCase();
}

export const CLIENT_COOKIE_NAME = COOKIE_NAME;
