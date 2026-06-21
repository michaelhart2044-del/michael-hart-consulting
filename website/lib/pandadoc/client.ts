import type { PandaDocConfig } from '@/lib/pandadoc/config';

const API_BASE = 'https://api.pandadoc.com/public/v1';

export interface PandaDocCreateDocumentBody {
  name: string;
  template_uuid: string;
  recipients: Array<{
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    signing_order?: number;
  }>;
  tokens: Array<{ name: string; value: string }>;
  fields?: Record<string, { value: string | number | boolean }>;
  images?: Array<{ name: string; urls: string[] }>;
  pricing_tables?: Array<{
    name: string;
    data_merge?: boolean;
    sections: Array<{
      title: string;
      default: boolean;
      rows: Array<{ data: Record<string, string | number> }>;
    }>;
  }>;
  metadata?: Record<string, string>;
  tags?: string[];
}

export interface PandaDocDocumentSummary {
  id: string;
  name: string;
  status: string;
  date_created?: string;
  date_modified?: string;
}

export interface PandaDocTemplateImage {
  name: string | null;
  block_uuid?: string;
}

export interface PandaDocTemplateDetails {
  id: string;
  name: string;
  images?: PandaDocTemplateImage[];
}

class PandaDocApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message);
    this.name = 'PandaDocApiError';
  }
}

async function pandadocFetch<T>(
  config: PandaDocConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `API-Key ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const detail = formatPandaDocApiPayload(payload);
    throw new PandaDocApiError(`PandaDoc API error (${res.status})`, res.status, detail);
  }

  return payload as T;
}

export async function createDocumentFromTemplate(
  config: PandaDocConfig,
  body: PandaDocCreateDocumentBody,
): Promise<PandaDocDocumentSummary> {
  return pandadocFetch(config, '/documents', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getDocumentStatus(
  config: PandaDocConfig,
  documentId: string,
): Promise<PandaDocDocumentSummary> {
  return pandadocFetch(config, `/documents/${documentId}`, { method: 'GET' });
}

export async function getTemplateDetails(
  config: PandaDocConfig,
  templateUuid: string,
): Promise<PandaDocTemplateDetails> {
  return pandadocFetch(config, `/templates/${templateUuid}/details`, { method: 'GET' });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** PandaDoc creates documents asynchronously — wait until editable draft. */
export async function waitForDocumentDraft(
  config: PandaDocConfig,
  documentId: string,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<PandaDocDocumentSummary> {
  const maxAttempts = options?.maxAttempts ?? 30;
  const intervalMs = options?.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const doc = await getDocumentStatus(config, documentId);
    if (doc.status === 'document.draft') return doc;
    if (doc.status === 'document.error') {
      throw new Error('PandaDoc reported document.error while creating the retainer.');
    }
    await sleep(intervalMs);
  }

  throw new Error('Timed out waiting for PandaDoc to finish creating the document (document.draft).');
}

function formatPandaDocApiPayload(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return 'Unknown PandaDoc response';

  const obj = payload as Record<string, unknown>;
  if (typeof obj.detail === 'string') return obj.detail;
  if (obj.detail && typeof obj.detail === 'object') {
    return JSON.stringify(obj.detail);
  }
  if (typeof obj.info_message === 'string') return obj.info_message;
  if (typeof obj.type === 'string') {
    return obj.type;
  }
  return JSON.stringify(payload);
}

export function formatPandaDocError(err: unknown): string {
  if (err instanceof PandaDocApiError) {
    const raw = err.detail ? `${err.message}: ${err.detail}` : err.message;
    if (raw.includes('Role') && raw.includes('does not exist')) {
      return `${raw} — Your template uses roles like Contractor and Customer. If you set PANDADOC_CLIENT_ROLE or PANDADOC_CONTRACTOR_ROLE in Vercel to something else, remove them or set Contractor / Customer.`;
    }
    if (raw.includes('Invalid block names') && raw.includes('images')) {
      return `${raw} — Your template has no Image block with that name. In PandaDoc: Insert → Image, name it (e.g. MH Logo), then set PANDADOC_LOGO_IMAGE_BLOCK_NAME in Vercel to match — or leave unset and we auto-detect when a block exists.`;
    }
    return raw;
  }
  if (err instanceof Error) {
    if (err.message.includes('fetch failed') || err.message.includes('ECONNRESET')) {
      return 'Could not reach PandaDoc — check your connection or try again in a moment.';
    }
    return err.message;
  }
  return 'Unknown PandaDoc error';
}
