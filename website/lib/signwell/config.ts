const SIGNWELL_API_BASE = 'https://www.signwell.com/api/v1';

export interface SignWellConfig {
  apiKey: string;
  testMode: boolean;
  templateNdaId?: string;
  templateRetainerId?: string;
  /** SignWell template placeholder role names — match your uploaded templates. */
  ownerPlaceholder: string;
  recipientPlaceholder: string;
}

export interface SignWellConfigStatus {
  configured: boolean;
  missing: string[];
  config: SignWellConfig | null;
}

function envBool(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return defaultValue;
}

export function getSignWellConfigStatus(): SignWellConfigStatus {
  const apiKey = process.env.SIGNWELL_API_KEY?.trim();
  const missing: string[] = [];
  if (!apiKey) missing.push('SIGNWELL_API_KEY');

  if (missing.length > 0) {
    return { configured: false, missing, config: null };
  }

  return {
    configured: true,
    missing: [],
    config: {
      apiKey: apiKey!,
      testMode: envBool('SIGNWELL_TEST_MODE', process.env.NODE_ENV !== 'production'),
      templateNdaId: process.env.SIGNWELL_TEMPLATE_NDA_ID?.trim(),
      templateRetainerId: process.env.SIGNWELL_TEMPLATE_RETAINER_ID?.trim(),
      ownerPlaceholder: process.env.SIGNWELL_OWNER_PLACEHOLDER?.trim() || 'Owner',
      recipientPlaceholder: process.env.SIGNWELL_RECIPIENT_PLACEHOLDER?.trim() || 'Recipient',
    },
  };
}

export function getSignWellNdaConfigStatus(): SignWellConfigStatus {
  const base = getSignWellConfigStatus();
  if (!base.configured || !base.config) return base;
  if (!base.config.templateNdaId) {
    return { configured: false, missing: ['SIGNWELL_TEMPLATE_NDA_ID'], config: base.config };
  }
  return base;
}

/** When true, send template_fields on create — only if matching TextFields exist in SignWell templates. */
export function signWellPrefillTemplateFieldsEnabled(): boolean {
  const raw = process.env.SIGNWELL_PREFILL_TEMPLATE_FIELDS?.trim().toLowerCase();
  return raw === 'true' || raw === '1';
}

/** When true (default), merge client data into the source PDF before uploading to SignWell. */
export function signWellPdfPrefillEnabled(): boolean {
  const raw = process.env.SIGNWELL_PDF_PREFILL?.trim().toLowerCase();
  if (raw === 'false' || raw === '0') return false;
  return true;
}

export function getSignWellRetainerConfigStatus(): SignWellConfigStatus {
  const base = getSignWellConfigStatus();
  if (!base.configured || !base.config) return base;
  if (!base.config.templateRetainerId) {
    return { configured: false, missing: ['SIGNWELL_TEMPLATE_RETAINER_ID'], config: base.config };
  }
  return base;
}

/** Browser URL to edit a SignWell document draft (not the public /documents path). */
export function signWellDocumentEditUrl(documentId: string): string {
  return `https://www.signwell.com/edit/document/${documentId}/`;
}

export function signWellTemplateEditUrl(templateId: string): string {
  return `https://www.signwell.com/app/template_builder/${templateId}`;
}

export { SIGNWELL_API_BASE };
