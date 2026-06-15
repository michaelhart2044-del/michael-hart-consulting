import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Client portal auth: signed magic-link tokens, email-confirmation tokens,
 * and httpOnly session cookies. No external auth provider required.
 */

const COOKIE_NAME = 'mh_client';
const SESSION_DAYS = 30;
const CONFIRM_DAYS = 7;

function getSecrets() {
  const secret = process.env.CLIENT_COOKIE_SECRET || process.env.ADMIN_COOKIE_SECRET;
  if (!secret) return null;
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

function parseSignedToken(
  token: string,
  expectedPrefix: string,
  partCount: number,
): { parts: string[]; payload: string; sig: string; exp: number } | null {
  if (!token) return null;
  const secrets = getSecrets();
  if (!secrets) return null;

  const parts = token.split(':');
  if (parts.length !== partCount) return null;
  if (parts[0] !== expectedPrefix) return null;

  const sig = parts[parts.length - 1];
  const payload = parts.slice(0, -1).join(':');
  const exp = Number(parts[parts.length - 2]);
  if (!exp || Date.now() > exp) return null;
  if (!verifySignature(payload, sig, secrets.secret)) return null;

  return { parts, payload, sig, exp };
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
  const parsed = parseSignedToken(token, 'client', 4);
  if (!parsed) return null;
  const email = parsed.parts[1];
  return email?.toLowerCase() || null;
}

/** Email confirmation token — ties invite to a specific submission record. */
export async function createEmailConfirmToken(submissionId: string, email: string): Promise<string | null> {
  const secrets = getSecrets();
  if (!secrets) return null;

  const exp = Date.now() + CONFIRM_DAYS * 24 * 60 * 60 * 1000;
  const payload = `confirm:${submissionId}:${email.toLowerCase()}:${exp}`;
  const sig = sign(payload, secrets.secret);
  return `${payload}:${sig}`;
}

export async function verifyEmailConfirmToken(
  token: string,
): Promise<{ submissionId: string; email: string } | null> {
  const parsed = parseSignedToken(token, 'confirm', 5);
  if (!parsed) return null;
  const submissionId = parsed.parts[1];
  const email = parsed.parts[2];
  if (!submissionId || !email) return null;
  return { submissionId, email: email.toLowerCase() };
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