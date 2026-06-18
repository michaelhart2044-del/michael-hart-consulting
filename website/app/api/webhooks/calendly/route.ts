import { NextResponse, after } from 'next/server';
import { processCalendlyWebhookBody } from '@/lib/calendly-webhook-handler';
import { verifyCalendlyWebhookSignature } from '@/lib/calendly-webhook-verify';
import { appendCalendlyWebhookLog, truncatePayloadForLog } from '@/lib/calendly-webhook-log';

export const runtime = 'nodejs';

async function handlePost(request: Request) {
  const rawBody = await request.text();
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  const signatureHeader = request.headers.get('calendly-webhook-signature');
  const verified = verifyCalendlyWebhookSignature(rawBody, signatureHeader, signingKey);

  if (!verified.ok) {
    const detail =
      verified.reason === 'missing-key'
        ? 'CALENDLY_WEBHOOK_SIGNING_KEY not configured'
        : `Signature verification failed: ${verified.reason}`;

    await appendCalendlyWebhookLog({
      event: 'unauthorized',
      email: '',
      eventSlug: '',
      outcome: 'invalid-signature',
      detail,
      rawPayloadPreview: truncatePayloadForLog(rawBody),
    });

    console.warn(`[calendly-webhook] 401 ${detail}`);
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    await appendCalendlyWebhookLog({
      event: 'parse-error',
      email: '',
      eventSlug: '',
      outcome: 'ignored',
      detail: 'Malformed JSON',
      rawPayloadPreview: truncatePayloadForLog(rawBody),
    });
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await processCalendlyWebhookBody(rawBody, parsed);

  after(() => {
    // Reserved for future heavy post-response work if needed.
  });

  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error('[calendly-webhook] unhandled error:', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

/** Calendly may send HEAD/GET when validating the subscription URL. */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'mh-calendly-webhook' });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
