import type { PrepSubmission } from '@/lib/submissions-store';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';
import { splitFullName } from '@/lib/split-full-name';
import type { PandaDocConfig } from '@/lib/pandadoc/config';
import type { PandaDocCreateDocumentBody } from '@/lib/pandadoc/client';

function formatProposalDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function buildRetainerDocumentRequest(
  submission: PrepSubmission,
  config: PandaDocConfig,
  clientCompany: string,
): PandaDocCreateDocumentBody {
  if (!submission.engagementQuote?.savedAt) {
    throw new Error('Save the engagement quote in Engagement Economics before creating a PandaDoc retainer.');
  }

  const { firstName, lastName } = splitFullName(submission.name);
  const { activationFee } = effectiveQuoteFees(submission.engagementQuote);
  if (!Number.isFinite(activationFee) || activationFee <= 0) {
    throw new Error('Activation retainer amount must be greater than $0.');
  }

  const company = clientCompany.trim() || submission.clientCompany?.trim() || submission.industry.trim();
  const documentName = `Engagement Activation Retainer — ${submission.name}`;

  return {
    name: documentName,
    template_uuid: config.templateUuid,
    recipients: [
      {
        email: config.contractorEmail,
        first_name: 'Michael',
        last_name: 'Hart',
        role: config.contractorRole,
        signing_order: 1,
      },
      {
        email: submission.email,
        first_name: firstName || submission.name,
        last_name: lastName || ' ',
        role: config.clientRole,
        signing_order: 2,
      },
    ],
    tokens: [
      { name: config.tokenNames.clientFirstName, value: firstName || submission.name },
      { name: config.tokenNames.clientLastName, value: lastName || ' ' },
      { name: config.tokenNames.clientCompany, value: company },
      { name: config.tokenNames.proposalDate, value: formatProposalDate() },
      { name: config.tokenNames.retainerAmount, value: formatUsd(activationFee) },
    ],
    metadata: {
      mh_submission_id: submission.id,
      mh_client_email: submission.email,
    },
    tags: ['mh-consulting', 'engagement-retainer'],
  };
}
