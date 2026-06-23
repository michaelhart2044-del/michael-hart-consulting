import { createHmac, timingSafeEqual } from 'crypto';

export interface SignWellWebhookEvent {
  type?: string;
  time?: number;
  hash?: string;
}

export type SignWellWebhookVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'missing-key' | 'missing-event' | 'invalid-signature' | 'skip-not-allowed' };

/** HMAC-SHA256(type@time) using SignWell webhook ID — see Event Hash Verification docs. */
export function verifySignWellWebhookEvent(
  event: SignWellWebhookEvent | null | undefined,
  webhookId: string | undefined,
): SignWellWebhookVerifyResult {
  if (!webhookId?.trim()) {
    return { ok: false, reason: 'missing-key' };
  }

  if (!event?.type || event.time == null || !event.hash) {
    return { ok: false, reason: 'missing-event' };
  }

  const data = `${event.type}@${event.time}`;
  const calculated = createHmac('sha256', webhookId.trim()).update(data).digest('hex');
  const expected = event.hash.trim();

  try {
    const a = Buffer.from(calculated, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'invalid-signature' };
    }
  } catch {
    return { ok: false, reason: 'invalid-signature' };
  }

  return { ok: true };
}
