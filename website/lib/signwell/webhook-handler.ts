import { contractorProfile } from '@/lib/pandadoc/contractor';
import { normalizeSignWellStatus } from '@/lib/signwell/owned-doc-status';
import {
  appendSignWellWebhookLog,
  truncatePayloadForLog,
  type SignWellWebhookLogOutcome,
} from '@/lib/signwell/webhook-log';
import { applySignWellDocumentEvent, type OwnedDocKind } from '@/lib/submissions-store';

export interface SignWellWebhookHandlerResult {
  status: number;
  body: { ok: boolean; outcome: SignWellWebhookLogOutcome; detail?: string };
}

const HANDLED_EVENTS = new Set([
  'document_sent',
  'document_signed',
  'document_completed',
  'document_declined',
  'document_canceled',
  'document_expired',
  'document_viewed',
  'document_in_progress',
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolveDocKind(metadata: Record<string, unknown> | null): OwnedDocKind | undefined {
  const kind = asString(metadata?.docKind);
  if (kind === 'nda' || kind === 'retainer') return kind;
  return undefined;
}

function resolveSignerRole(signerEmail?: string): 'owner' | 'recipient' | undefined {
  if (!signerEmail) return undefined;
  const normalized = signerEmail.trim().toLowerCase();
  if (normalized === contractorProfile.email.trim().toLowerCase()) return 'owner';
  return 'recipient';
}

async function logAndReturn(
  status: number,
  outcome: SignWellWebhookLogOutcome,
  fields: {
    eventType: string;
    documentId: string;
    matchedSubmissionId?: string;
    docKind?: OwnedDocKind;
    detail?: string;
    rawPayloadPreview?: string;
  },
): Promise<SignWellWebhookHandlerResult> {
  await appendSignWellWebhookLog({
    eventType: fields.eventType,
    documentId: fields.documentId,
    matchedSubmissionId: fields.matchedSubmissionId,
    docKind: fields.docKind,
    outcome,
    detail: fields.detail,
    rawPayloadPreview: fields.rawPayloadPreview,
  });

  console.log(
    `[signwell-webhook] ${fields.eventType} ${fields.documentId} → ${outcome}${fields.detail ? ` (${fields.detail})` : ''}`,
  );

  return { status, body: { ok: status < 400, outcome, detail: fields.detail } };
}

export async function processSignWellWebhookBody(
  rawBody: string,
  parsed: unknown,
): Promise<SignWellWebhookHandlerResult> {
  const preview = truncatePayloadForLog(rawBody);

  if (!parsed || typeof parsed !== 'object') {
    return logAndReturn(400, 'ignored', {
      eventType: 'unknown',
      documentId: '',
      detail: 'Invalid JSON body',
      rawPayloadPreview: preview,
    });
  }

  const envelope = parsed as { event?: Record<string, unknown>; data?: Record<string, unknown> };
  const event = asRecord(envelope.event);
  const eventType = asString(event?.type) || 'unknown';

  const data = asRecord(envelope.data);
  const object = asRecord(data?.object);
  const documentId = asString(object?.id) || '';
  const metadata = asRecord(object?.metadata);
  const docKind = resolveDocKind(metadata);
  const status = normalizeSignWellStatus(asString(object?.status));

  const relatedSigner = asRecord(event?.related_signer);
  const signerEmail = asString(relatedSigner?.email);
  const signerRole = resolveSignerRole(signerEmail);
  const eventTime = typeof event?.time === 'number' ? event.time : undefined;

  if (!HANDLED_EVENTS.has(eventType)) {
    return logAndReturn(200, 'ignored', {
      eventType,
      documentId,
      docKind,
      detail: 'Unhandled event type',
      rawPayloadPreview: preview,
    });
  }

  if (!documentId) {
    return logAndReturn(400, 'ignored', {
      eventType,
      documentId: '',
      detail: 'Missing document id',
      rawPayloadPreview: preview,
    });
  }

  const result = await applySignWellDocumentEvent({
    documentId,
    eventType,
    status,
    metadata,
    signerRole,
    eventTime,
  });

  if (!result.updated) {
    return logAndReturn(200, 'no-match', {
      eventType,
      documentId,
      docKind,
      detail: result.detail || 'No matching submission',
      rawPayloadPreview: preview,
    });
  }

  return logAndReturn(200, 'updated', {
    eventType,
    documentId,
    matchedSubmissionId: result.submissionId,
    docKind: result.docKind,
    detail: result.detail,
    rawPayloadPreview: preview,
  });
}
