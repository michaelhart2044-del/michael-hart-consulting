import type { SignWellConfig } from '@/lib/signwell/config';
import type { SignWellRecipient } from '@/lib/signwell/client';
import { signWellFetch } from '@/lib/signwell/client';

export interface SignWellTemplatePlaceholder {
  id: string;
  name: string;
  signing_order?: number;
}

export interface SignWellPlacedField {
  api_id?: string;
  type: string;
  page: number;
  x: number;
  y: number;
  width: string | number;
  height: string | number;
  required?: boolean;
  placeholder_name?: string;
  recipient_id?: string;
  label?: string;
  value?: string | null;
}

export interface SignWellTemplateResponse {
  id: string;
  name?: string;
  fields?: SignWellPlacedField[][];
  placeholders?: SignWellTemplatePlaceholder[];
  files?: Array<{ name: string; pages_number: number }>;
}

export async function getSignWellTemplate(
  config: SignWellConfig,
  templateId: string,
): Promise<SignWellTemplateResponse> {
  return signWellFetch<SignWellTemplateResponse>(config, `/document_templates/${templateId}`, {
    method: 'GET',
  });
}

const SIGNATURE_TYPES = new Set(['signature', 'initials']);

/** Copy signature field placements from a SignWell template onto a new filled PDF upload. */
export function mapTemplateSignatureFields(
  templateFields: SignWellPlacedField[][] | undefined,
  recipients: SignWellRecipient[],
): SignWellPlacedField[][] {
  const placeholderToRecipientId = new Map<string, string>();
  for (const recipient of recipients) {
    if (recipient.placeholder_name) {
      placeholderToRecipientId.set(recipient.placeholder_name, recipient.id);
    }
  }

  const files = templateFields ?? [[]];
  return files.map((fileFields) =>
    fileFields
      .filter((field) => SIGNATURE_TYPES.has(field.type))
      .map((field) => {
        const recipientId = field.placeholder_name
          ? placeholderToRecipientId.get(field.placeholder_name)
          : field.recipient_id;
        return {
          type: field.type,
          page: field.page,
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          required: field.required ?? true,
          ...(field.api_id ? { api_id: field.api_id } : {}),
          ...(recipientId ? { recipient_id: recipientId } : {}),
        };
      }),
  );
}
