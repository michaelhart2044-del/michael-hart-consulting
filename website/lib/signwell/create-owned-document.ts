import type { PrepSubmission } from '@/lib/submissions-store';
import type { PandaDocClientDetails } from '@/lib/pandadoc/client-details';
import { contractorProfile } from '@/lib/pandadoc/contractor';
import { buildDocumentMergeFields, mergeFieldsToTokenMap } from '@/lib/documents/merge-fields';
import type { SignWellConfig } from '@/lib/signwell/config';
import {
  createDocumentFromTemplate,
  type SignWellCreateFromTemplateRequest,
  type SignWellTemplateField,
} from '@/lib/signwell/client';

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

/** Map merge tokens to SignWell template_fields — api_id must match template field IDs in SignWell. */
function buildTemplateFields(tokenMap: Record<string, string>): SignWellTemplateField[] {
  return Object.entries(tokenMap)
    .filter(([, value]) => value.trim().length > 0)
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

  return {
    template_id: templateIdForKind(config, kind),
    name: documentName(kind, sub, company),
    draft: true,
    recipients: [
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
    ],
    template_fields: buildTemplateFields(tokenMap),
    metadata: {
      submissionId: sub.id,
      docKind: kind,
    },
  };
}

export async function createOwnedSignWellDocument(
  kind: OwnedDocKind,
  sub: PrepSubmission,
  config: SignWellConfig,
  clientDetails: PandaDocClientDetails,
) {
  const body = await buildSignWellDocumentRequest(kind, sub, config, clientDetails);
  return createDocumentFromTemplate(config, body);
}
