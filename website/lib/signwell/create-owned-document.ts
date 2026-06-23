import type { PrepSubmission } from '@/lib/submissions-store';
import type { PandaDocClientDetails } from '@/lib/pandadoc/client-details';
import { contractorProfile } from '@/lib/pandadoc/contractor';
import {
  buildDocumentMergeFields,
  mergeFieldsToPdfTokenMap,
  mergeFieldsToTokenMap,
} from '@/lib/documents/merge-fields';
import { fillPdfTokenBuffer } from '@/lib/documents/fill-pdf-tokens';
import { legalPdfOutputName, readLegalSourcePdf } from '@/lib/documents/legal-pdf-source';
import type { SignWellConfig } from '@/lib/signwell/config';
import {
  signWellPdfPrefillEnabled,
  signWellPrefillTemplateFieldsEnabled,
} from '@/lib/signwell/config';
import {
  createDocument,
  createDocumentFromTemplate,
  type SignWellCreateFromTemplateRequest,
  type SignWellRecipient,
  type SignWellTemplateField,
} from '@/lib/signwell/client';
import { getSignWellTemplate, mapTemplateSignatureFields } from '@/lib/signwell/template';

export type OwnedDocKind = 'nda' | 'retainer';

function documentName(kind: OwnedDocKind, sub: PrepSubmission, company: string): string {
  const prefix = kind === 'nda' ? 'Mutual NDA' : 'Phase 1 Activation Retainer';
  return `${prefix} — ${company || sub.name}`.slice(0, 120);
}

function templateIdForKind(config: SignWellConfig, kind: OwnedDocKind): string {
  const id = kind === 'nda' ? config.templateNdaId : config.templateRetainerId;
  if (!id) throw new Error(`SignWell template not configured for ${kind}`);
  return id;
}

function buildRecipients(config: SignWellConfig, sub: PrepSubmission): SignWellRecipient[] {
  return [
    {
      id: '1',
      placeholder_name: config.ownerPlaceholder,
      name: `${contractorProfile.firstName} ${contractorProfile.lastName}`,
      email: contractorProfile.email,
    },
    {
      id: '2',
      placeholder_name: config.recipientPlaceholder,
      name: sub.name,
      email: sub.email,
    },
  ];
}

const NDA_PREFILL_KEYS = new Set([
  'Owner.FirstName',
  'Owner.LastName',
  'Owner.Company',
  'Owner.State',
  'Owner.Email',
  'Recipient.FirstName',
  'Recipient.LastName',
  'Recipient.Company',
  'Recipient.Email',
  'Date',
  'Company website',
  'Recipient.StreetAddress',
  'Recipient.City',
  'Recipient.State',
  'Recipient.PostalCode',
]);

const RETAINER_EXTRA_KEYS = new Set(['RETAINER AMOUNT', 'TOTAL PHASE 1 FEE', 'BALANCE DUE']);

function buildTemplateFields(
  kind: OwnedDocKind,
  tokenMap: Record<string, string>,
): SignWellTemplateField[] {
  const allowed =
    kind === 'nda'
      ? NDA_PREFILL_KEYS
      : new Set([...NDA_PREFILL_KEYS, ...RETAINER_EXTRA_KEYS]);
  return Object.entries(tokenMap)
    .filter(([api_id, value]) => allowed.has(api_id) && value.trim().length > 0)
    .map(([api_id, value]) => ({ api_id, value }));
}

export async function buildSignWellDocumentRequest(
  kind: OwnedDocKind,
  sub: PrepSubmission,
  config: SignWellConfig,
  clientDetails: PandaDocClientDetails,
): Promise<SignWellCreateFromTemplateRequest> {
  const fields = buildDocumentMergeFields(sub, clientDetails);
  const tokenMap = mergeFieldsToTokenMap(fields);
  const company = clientDetails.company.trim();

  const request: SignWellCreateFromTemplateRequest = {
    template_id: templateIdForKind(config, kind),
    name: documentName(kind, sub, company),
    draft: true,
    recipients: buildRecipients(config, sub),
    metadata: {
      submissionId: sub.id,
      docKind: kind,
    },
  };

  if (signWellPrefillTemplateFieldsEnabled()) {
    const templateFields = buildTemplateFields(kind, tokenMap);
    if (templateFields.length > 0) request.template_fields = templateFields;
  }

  return request;
}

async function createOwnedSignWellDocumentWithFilledPdf(
  kind: OwnedDocKind,
  sub: PrepSubmission,
  config: SignWellConfig,
  clientDetails: PandaDocClientDetails,
) {
  const mergeFields = buildDocumentMergeFields(sub, clientDetails);
  const tokenMap = mergeFieldsToPdfTokenMap(mergeFields);
  const company = clientDetails.company.trim();
  const recipients = buildRecipients(config, sub);
  const templateId = templateIdForKind(config, kind);

  const [sourcePdf, template] = await Promise.all([
    readLegalSourcePdf(kind),
    getSignWellTemplate(config, templateId),
  ]);

  const filledPdf = fillPdfTokenBuffer(sourcePdf, tokenMap);
  const signatureFields = mapTemplateSignatureFields(template.fields, recipients);
  if (!signatureFields.some((fileFields) => fileFields.length > 0)) {
    throw new Error(
      `SignWell template for ${kind} has no signature fields. Open the template in SignWell and confirm Owner + Recipient signature boxes are saved.`,
    );
  }

  return createDocument(config, {
    name: documentName(kind, sub, company),
    draft: true,
    recipients,
    files: [
      {
        name: legalPdfOutputName(kind, company || sub.name),
        file_base64: filledPdf.toString('base64'),
      },
    ],
    fields: signatureFields,
    metadata: {
      submissionId: sub.id,
      docKind: kind,
      signWellTemplateId: templateId,
    },
  });
}

export async function createOwnedSignWellDocument(
  kind: OwnedDocKind,
  sub: PrepSubmission,
  config: SignWellConfig,
  clientDetails: PandaDocClientDetails,
) {
  if (signWellPdfPrefillEnabled()) {
    return createOwnedSignWellDocumentWithFilledPdf(kind, sub, config, clientDetails);
  }

  const body = await buildSignWellDocumentRequest(kind, sub, config, clientDetails);
  return createDocumentFromTemplate(config, body);
}
