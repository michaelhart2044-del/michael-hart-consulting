import { SIGNWELL_API_BASE, signWellDocumentEditUrl, type SignWellConfig } from '@/lib/signwell/config';

export class SignWellApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'SignWellApiError';
    this.status = status;
    this.body = body;
  }
}

export interface SignWellRecipient {
  id: string;
  placeholder_name?: string;
  name: string;
  email: string;
}

export interface SignWellTemplateField {
  api_id: string;
  value: string;
}

export interface SignWellCreateFromTemplateRequest {
  template_id: string;
  name?: string;
  draft?: boolean;
  test_mode?: boolean;
  apply_signing_order?: boolean;
  recipients: SignWellRecipient[];
  template_fields?: SignWellTemplateField[];
  metadata?: Record<string, string>;
}

export interface SignWellDocumentFile {
  name: string;
  file_base64: string;
}

export interface SignWellCreateDocumentField {
  api_id?: string;
  type: string;
  page: number;
  x: number;
  y: number;
  width: string | number;
  height: string | number;
  required?: boolean;
  recipient_id?: string;
  label?: string;
}

export interface SignWellCreateDocumentRequest {
  name?: string;
  draft?: boolean;
  test_mode?: boolean;
  apply_signing_order?: boolean;
  recipients: SignWellRecipient[];
  files: SignWellDocumentFile[];
  fields: SignWellCreateDocumentField[][];
  metadata?: Record<string, string>;
}

export interface SignWellDocumentResponse {
  id: string;
  name?: string;
  status?: string;
  embedded_edit_url?: string;
  recipients?: Array<{
    id: string;
    email?: string;
    name?: string;
    status?: string;
    embedded_signing_url?: string;
  }>;
}

export async function signWellFetch<T>(
  config: SignWellConfig,
  path: string,
  init: RequestInit,
): Promise<T> {
  const res = await fetch(`${SIGNWELL_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': config.apiKey,
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text
  }

  if (!res.ok) {
    const msg =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : `SignWell API error (${res.status})`;
    throw new SignWellApiError(msg, res.status, body);
  }

  return body as T;
}

export async function createDocument(
  config: SignWellConfig,
  body: SignWellCreateDocumentRequest,
): Promise<SignWellDocumentResponse> {
  const payload: Record<string, unknown> = {
    test_mode: config.testMode,
    draft: true,
    apply_signing_order: true,
    ...body,
  };
  return signWellFetch<SignWellDocumentResponse>(config, '/documents/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createDocumentFromTemplate(
  config: SignWellConfig,
  body: SignWellCreateFromTemplateRequest,
): Promise<SignWellDocumentResponse> {
  const payload: Record<string, unknown> = {
    test_mode: config.testMode,
    draft: true,
    apply_signing_order: true,
    ...body,
  };
  if (!body.template_fields?.length) {
    delete payload.template_fields;
  }
  return signWellFetch<SignWellDocumentResponse>(config, '/document_templates/documents/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function resolveSignWellDocumentEditUrl(doc: SignWellDocumentResponse): string {
  if (doc.embedded_edit_url?.trim()) return doc.embedded_edit_url.trim();
  return signWellDocumentEditUrl(doc.id);
}

export function formatSignWellError(err: unknown): string {
  if (err instanceof SignWellApiError) {
    if (typeof err.body === 'object' && err.body !== null && 'errors' in err.body) {
      return `${err.message}: ${JSON.stringify((err.body as { errors: unknown }).errors)}`;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'SignWell request failed.';
}
