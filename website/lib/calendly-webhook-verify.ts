import { createHmac, timingSafeEqual } from 'crypto';

const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;

export type CalendlySignatureResult =
  | { ok: true }
  | { ok: false; reason: 'missing-key' | 'missing-header' | 'invalid-format' | 'expired' | 'mismatch' };

/** Verify Calendly-Webhook-Signature: t=<unix>,v1=<hmac-sha256 hex> */
export function verifyCalendlyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string | undefined,
): CalendlySignatureResult {
  if (!signingKey?.trim()) {
    return { ok: false, reason: 'missing-key' };
  }

  if (!signatureHeader?.trim()) {
    return { ok: false, reason: 'missing-header' };
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((pair) => {
      const [k, v] = pair.trim().split('=');
      return [k, v];
    }),
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) {
    return { ok: false, reason: 'invalid-format' };
  }

  const tsMs = Number(timestamp) * 1000;
  if (!Number.isFinite(tsMs) || Date.now() - tsMs > MAX_SIGNATURE_AGE_MS) {
    return { ok: false, reason: 'expired' };
  }

  const expected = createHmac('sha256', signingKey.trim())
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'mismatch' };
    }
  } catch {
    return { ok: false, reason: 'mismatch' };
  }

  return { ok: true };
}

export function verifyWebhookTestSecret(
  testHeader: string | null,
  expectedSecret: string | undefined,
): boolean {
  if (!expectedSecret?.trim() || !testHeader?.trim()) return false;
  try {
    const a = Buffer.from(testHeader.trim(), 'utf8');
    const b = Buffer.from(expectedSecret.trim(), 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}