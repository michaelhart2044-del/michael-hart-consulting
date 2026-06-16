import {
  classifyCalendlySlug,
  resolveSlugFromWebhookPayload,
  type CalendlyMeetingKind,
} from '@/lib/calendly-config';
import { notifyMichaelConsultBooked } from '@/lib/notify-consult-booked';
import {
  appendCalendlyWebhookLog,
  truncatePayloadForLog,
  type CalendlyWebhookLogOutcome,
} from '@/lib/calendly-webhook-log';
import {
  applyCalendlyWebhookToSubmission,
  getLatestComprehensiveBookedSubmissionByEmail,
  getLatestConsult30BookedSubmissionByEmail,
  getLatestUnbookedSubmissionByEmail,
  getSubmissionById,
  getSubmissionForComprehensiveBooking,
  type PrepSubmission,
} from '@/lib/submissions-store';

export type CalendlyWebhookEventName = 'invitee.created' | 'invitee.canceled';

export interface CalendlyWebhookHandlerResult {
  status: number;
  body: { ok: boolean; outcome: CalendlyWebhookLogOutcome; detail?: string };
}

export interface MhWebhookTestBody {
  mh_test?: boolean;
  event: CalendlyWebhookEventName;
  kind: CalendlyMeetingKind;
  email: string;
  submissionId?: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function extractSubmissionIdFromPayload(payload: Record<string, unknown>): string | null {
  const qa = payload.questions_and_answers;
  if (!Array.isArray(qa)) return null;

  for (const item of qa) {
    if (!item || typeof item !== 'object') continue;
    const answer = String((item as { answer?: string }).answer || '');
    const match = answer.match(/prep_[a-z0-9_]+/i);
    if (match) return match[0];
  }
  return null;
}

async function resolveSubmissionForWebhook(
  kind: CalendlyMeetingKind,
  event: CalendlyWebhookEventName,
  email: string,
  submissionIdHint?: string | null,
): Promise<PrepSubmission | null> {
  if (submissionIdHint) {
    const byId = await getSubmissionById(submissionIdHint);
    if (byId && normalizeEmail(byId.email) === normalizeEmail(email)) {
      return byId;
    }
  }

  const normalized = normalizeEmail(email);

  if (event === 'invitee.created') {
    if (kind === 'consult30') {
      return getLatestUnbookedSubmissionByEmail(normalized);
    }
    return getSubmissionForComprehensiveBooking(normalized);
  }

  if (kind === 'consult30') {
    return getLatestConsult30BookedSubmissionByEmail(normalized);
  }
  return getLatestComprehensiveBookedSubmissionByEmail(normalized);
}

async function logAndReturn(
  status: number,
  outcome: CalendlyWebhookLogOutcome,
  fields: {
    event: string;
    email: string;
    eventSlug: string;
    matchedSubmissionId?: string;
    detail?: string;
    rawPayloadPreview?: string;
  },
): Promise<CalendlyWebhookHandlerResult> {
  await appendCalendlyWebhookLog({
    event: fields.event,
    email: fields.email,
    eventSlug: fields.eventSlug,
    matchedSubmissionId: fields.matchedSubmissionId,
    outcome,
    detail: fields.detail,
    rawPayloadPreview: fields.rawPayloadPreview,
  });

  console.log(
    `[calendly-webhook] ${fields.event} ${fields.eventSlug} ${fields.email} → ${outcome}${fields.detail ? ` (${fields.detail})` : ''}`,
  );

  return { status, body: { ok: status < 400, outcome, detail: fields.detail } };
}

export async function processCalendlyWebhookBody(
  rawBody: string,
  parsed: unknown,
  options?: { isTest?: boolean },
): Promise<CalendlyWebhookHandlerResult> {
  const preview = truncatePayloadForLog(rawBody);

  if (options?.isTest && parsed && typeof parsed === 'object') {
    const test = parsed as MhWebhookTestBody;
    if (test.mh_test && test.event && test.kind && test.email) {
      return processResolvedWebhook({
        event: test.event,
        kind: test.kind,
        email: test.email,
        submissionIdHint: test.submissionId,
        eventSlug:
          test.kind === 'consult30' ? '30min' : 'comprehensive-process-review-roadmap',
        inviteeUri: 'mh-test-simulator',
        rawPayloadPreview: preview,
        isTest: true,
      });
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return logAndReturn(400, 'ignored', {
      event: 'unknown',
      email: '',
      eventSlug: '',
      detail: 'Invalid JSON body',
      rawPayloadPreview: preview,
    });
  }

  const envelope = parsed as { event?: string; payload?: Record<string, unknown> };
  const eventName = envelope.event;

  if (eventName !== 'invitee.created' && eventName !== 'invitee.canceled') {
    return logAndReturn(200, 'ignored', {
      event: eventName || 'unknown',
      email: '',
      eventSlug: '',
      detail: 'Unsupported event type',
      rawPayloadPreview: preview,
    });
  }

  const payload = envelope.payload;
  if (!payload || typeof payload !== 'object') {
    return logAndReturn(200, 'ignored', {
      event: eventName,
      email: '',
      eventSlug: '',
      detail: 'Missing payload',
      rawPayloadPreview: preview,
    });
  }

  const email = normalizeEmail(String(payload.email || ''));
  if (!email) {
    return logAndReturn(200, 'ignored', {
      event: eventName,
      email: '',
      eventSlug: '',
      detail: 'Missing invitee email',
      rawPayloadPreview: preview,
    });
  }

  const slug = resolveSlugFromWebhookPayload(parsed);
  if (!slug) {
    return logAndReturn(200, 'ignored', {
      event: eventName,
      email,
      eventSlug: '',
      detail: 'Could not resolve event slug',
      rawPayloadPreview: preview,
    });
  }

  const kind = classifyCalendlySlug(slug);
  if (!kind) {
    return logAndReturn(200, 'ignored', {
      event: eventName,
      email,
      eventSlug: slug,
      detail: 'Unknown event slug',
      rawPayloadPreview: preview,
    });
  }

  const submissionIdHint = extractSubmissionIdFromPayload(payload);
  const inviteeUri = typeof payload.uri === 'string' ? payload.uri : undefined;

  return processResolvedWebhook({
    event: eventName,
    kind,
    email,
    submissionIdHint,
    eventSlug: slug,
    inviteeUri,
    rawPayloadPreview: preview,
    isTest: false,
  });
}

async function processResolvedWebhook(input: {
  event: CalendlyWebhookEventName;
  kind: CalendlyMeetingKind;
  email: string;
  submissionIdHint?: string | null;
  eventSlug: string;
  inviteeUri?: string;
  rawPayloadPreview?: string;
  isTest: boolean;
}): Promise<CalendlyWebhookHandlerResult> {
  const submission = await resolveSubmissionForWebhook(
    input.kind,
    input.event,
    input.email,
    input.submissionIdHint,
  );

  if (!submission) {
    return logAndReturn(200, 'no-match', {
      event: input.event,
      email: input.email,
      eventSlug: input.eventSlug,
      detail: 'No matching client record',
      rawPayloadPreview: input.rawPayloadPreview,
    });
  }

  const meta = {
    inviteeUri: input.inviteeUri,
    eventSlug: input.eventSlug,
    ...(input.kind === 'consult30' ? { source: 'webhook' as const } : {}),
  };

  const applied = await applyCalendlyWebhookToSubmission(
    submission.id,
    input.kind,
    input.event,
    meta,
  );

  if (!applied) {
    return logAndReturn(500, 'ignored', {
      event: input.event,
      email: input.email,
      eventSlug: input.eventSlug,
      matchedSubmissionId: submission.id,
      detail: 'Failed to update submission',
      rawPayloadPreview: input.rawPayloadPreview,
    });
  }

  if (
    input.kind === 'consult30' &&
    input.event === 'invitee.created' &&
    applied.newlyBooked &&
    !input.isTest
  ) {
    void notifyMichaelConsultBooked(applied.submission).catch((err) => {
      console.error('[calendly-webhook] async notify failed:', err);
    });
  }

  return logAndReturn(200, input.isTest ? 'test' : 'updated', {
    event: input.event,
    email: input.email,
    eventSlug: input.eventSlug,
    matchedSubmissionId: applied.submission.id,
    detail: applied.newlyBooked ? 'newly-booked' : 'idempotent-no-op',
    rawPayloadPreview: input.rawPayloadPreview,
  });
}