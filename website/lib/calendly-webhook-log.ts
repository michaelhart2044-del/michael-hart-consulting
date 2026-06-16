import { promises as fs } from 'fs';
import path from 'path';
import { get, put, BlobNotFoundError } from '@vercel/blob';

export type CalendlyWebhookLogOutcome =
  | 'updated'
  | 'no-match'
  | 'ignored'
  | 'invalid-signature'
  | 'test';

export interface CalendlyWebhookLogEntry {
  receivedAt: string;
  event: string;
  email: string;
  eventSlug: string;
  matchedSubmissionId?: string;
  outcome: CalendlyWebhookLogOutcome;
  detail?: string;
  rawPayloadPreview?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'calendly-webhook-log.json');
const BLOB_PATHNAME = 'data/calendly-webhook-log.json';
const MAX_ENTRIES = 50;
const MAX_PAYLOAD_PREVIEW = 4096;

function useBlobStorage(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function loadFromDisk(): Promise<CalendlyWebhookLogEntry[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadFromBlob(): Promise<CalendlyWebhookLogEntry[]> {
  try {
    const result = await get(BLOB_PATHNAME, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) return [];
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err instanceof BlobNotFoundError) return [];
    console.error('calendly-webhook-log blob read failed:', err);
    return [];
  }
}

async function persist(entries: CalendlyWebhookLogEntry[]) {
  const trimmed = entries
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, MAX_ENTRIES);

  if (useBlobStorage()) {
    await put(BLOB_PATHNAME, JSON.stringify(trimmed, null, 2), {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    return;
  }

  await ensureDataDir();
  await fs.writeFile(FILE_PATH, JSON.stringify(trimmed, null, 2), 'utf8');
}

export async function getCalendlyWebhookLogs(limit = 10): Promise<CalendlyWebhookLogEntry[]> {
  const all = useBlobStorage() ? await loadFromBlob() : await loadFromDisk();
  return [...all]
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, limit);
}

export async function getLatestCalendlyWebhookLog(): Promise<CalendlyWebhookLogEntry | null> {
  const logs = await getCalendlyWebhookLogs(1);
  return logs[0] ?? null;
}

export async function appendCalendlyWebhookLog(
  entry: Omit<CalendlyWebhookLogEntry, 'receivedAt'> & { receivedAt?: string },
): Promise<CalendlyWebhookLogEntry> {
  const full: CalendlyWebhookLogEntry = {
    receivedAt: entry.receivedAt || new Date().toISOString(),
    event: entry.event,
    email: entry.email,
    eventSlug: entry.eventSlug,
    matchedSubmissionId: entry.matchedSubmissionId,
    outcome: entry.outcome,
    detail: entry.detail,
    rawPayloadPreview: entry.rawPayloadPreview?.slice(0, MAX_PAYLOAD_PREVIEW),
  };

  const current = useBlobStorage() ? await loadFromBlob() : await loadFromDisk();
  await persist([full, ...current]);
  return full;
}

export function truncatePayloadForLog(rawBody: string): string {
  return rawBody.slice(0, MAX_PAYLOAD_PREVIEW);
}