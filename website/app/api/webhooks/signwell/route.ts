import { NextResponse } from 'next/server';
import { processSignWellWebhookBody } from '@/lib/signwell/webhook-handler';
import { verifySignWellWebhookEvent } from '@/lib/signwell/webhook-verify';
import { appendSignWellWebhookLog, truncatePayloadForLog } from '@/lib/signwell/webhook-log';

export const runtime = 'nodejs';

async function handlePost(request: Request) {
  const rawBody = await request.text();
  const webhookId = process.env.SIGNWELL_WEBHOOK_ID?.trim();

  let parsed: unknown;
  try {
    parsed = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    await appendSignWellWebhookLog({
      eventType: 'parse-error',
      documentId: '',
      outcome: 'ignored',
      detail: 'Malformed JSON',
      rawPayloadPreview: truncatePayloadForLog(rawBody),
    });
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const event =
    parsed && typeof parsed === 'object' && 'event' in parsed
      ? (parsed as { event?: { type?: string; time?: number; hash?: string } }).event
      : undefined;

  const verified = verifySignWellWebhookEvent(event, webhookId);
  if (!verified.ok) {
    const detail =
      verified.reason === 'missing-key'
        ? 'SIGNWELL_WEBHOOK_ID not configured'
        : verified.reason === 'missing-event'
          ? 'Missing event.type, event.time, or event.hash'
          : 'Signature verification failed';

    await appendSignWellWebhookLog({
      eventType: event?.type || 'unauthorized',
      documentId: '',
      outcome: 'invalid-signature',
      detail,
      rawPayloadPreview: truncatePayloadForLog(rawBody),
    });

    console.warn(`[signwell-webhook] 401 ${detail}`);
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processSignWellWebhookBody(rawBody, parsed);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error('[signwell-webhook] unhandled error:', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

/** SignWell may probe the callback URL when registering a webhook. */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'mh-signwell-webhook' });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
