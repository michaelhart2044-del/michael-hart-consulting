import { site } from './site';

const VERIFIED_DOMAIN = 'michaelhartconsulting.com';

function extractEmailAddress(from: string): string | null {
  const bracketMatch = from.match(/<([^>]+)>/);
  if (bracketMatch) return bracketMatch[1].trim().toLowerCase();

  const trimmed = from.trim().toLowerCase();
  return trimmed.includes('@') ? trimmed : null;
}

function isVerifiedDomainEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${VERIFIED_DOMAIN}`) && !normalized.endsWith('@resend.dev');
}

/**
 * Resolves the sender email address for all Resend API calls.
 * Defaults to onboarding@michaelhartconsulting.com (verified domain).
 * Ignores malformed RESEND_FROM overrides (e.g. "onboarding@" without domain).
 */
export function getResendSenderEmail(): string {
  const fallback = site.resendFromEmail;
  const override = process.env.RESEND_FROM?.trim();

  if (!override) return fallback;

  const email = extractEmailAddress(override);
  if (email && isVerifiedDomainEmail(email)) {
    return email;
  }

  console.error(
    `RESEND_FROM is invalid or uses an unverified domain ("${override}"). Falling back to ${fallback}.`
  );
  return fallback;
}

/** Builds a Resend "from" header using the verified domain sender. */
export function getResendFrom(label?: string): string {
  const email = getResendSenderEmail();
  const displayName = label || site.name;
  return `${displayName} <${email}>`;
}