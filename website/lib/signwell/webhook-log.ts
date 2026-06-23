import { promises as fs } from 'fs';
import path from 'path';
import { get, put, BlobNotFoundError } from '@vercel/blob';

export type SignWellWebhookLogOutcome =
  | 'updated'
  | 'no-match'
  | 'ignored'
  | 'invalid-signature';

export interface SignWellWebhookLogEntry {
  receivedAt: string;
  eventType: string;
  documentId: string;
  matchedSubmissionId?: string;
  docKind?: 'nda' | 'retainer';
  outcome: SignWellWebhookLogOutcome;
  detail?: string;
  rawPayloadPreview?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'signwell-webhook-log.json');
const BLOB_PATHNAME = 'data/signwell-webhook-log.json';
const MAX_ENTRIES = 50;
const MAX_PAYLOAD_PREVIEW = 4096;

function isBlobStorageEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function loadFromDisk(): Promise<SignWellWebhookLogEntry[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadFromBlob(): Promise<SignWellWebhookLogEntry[]> {
  try {
    const result = await get(BLOB_PATHNAME, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) return [];
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err instanceof BlobNotFoundError) return [];
    console.error('signwell-webhook-log blob read failed:', err);
    return [];
  }
}

async function persist(entries: SignWellWebhookLogEntry[]) {
  const trimmed = entries
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, MAX_ENTRIES);

  if (isBlobStorageEnabled()) {
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

export function truncatePayloadForLog(raw: string): string {
  if (raw.length <= MAX_PAYLOAD_PREVIEW) return raw;
  return `${raw.slice(0, MAX_PAYLOAD_PREVIEW)}…`;
}

export async function appendSignWellWebhookLog(entry: Omit<SignWellWebhookLogEntry, 'receivedAt'>) {
  const rows = isBlobStorageEnabled() ? await loadFromBlob() : await loadFromDisk();
  rows.unshift({ ...entry, receivedAt: new Date().toISOString() });
  await persist(rows);
}

export async function getLatestSignWellWebhookLog(): Promise<SignWellWebhookLogEntry | null> {
  const rows = isBlobStorageEnabled() ? await loadFromBlob() : await loadFromDisk();
  return rows[0] ?? null;
}
