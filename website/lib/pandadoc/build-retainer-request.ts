import type { PrepSubmission } from '@/lib/submissions-store';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';
import { splitFullName } from '@/lib/split-full-name';
import { site } from '@/lib/site';
import type { PandaDocConfig } from '@/lib/pandadoc/config';
import type { PandaDocCreateDocumentBody } from '@/lib/pandadoc/client';

function formatProposalDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function absoluteAssetUrl(path: string): string {
  const base = site.url.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** PandaDoc token names must match the template exactly — send common aliases. */
function tokenVariants(primary: string, aliases: string[]): string[] {
  return [...new Set([primary, ...aliases].filter(Boolean))];
}

function buildTokens(
  config: PandaDocConfig,
  values: {
    firstName: string;
    lastName: string;
    company: string;
    website: string;
    proposalDate: string;
    retainerAmount: string;
  },
): Array<{ name: string; value: string }> {
  const entries: Array<{ name: string; value: string }> = [];

  const add = (names: string[], value: string) => {
    for (const name of names) {
      entries.push({ name, value });
    }
  };

  add(tokenVariants(config.tokenNames.clientFirstName, ['Customer.FirstName']), values.firstName);
  add(tokenVariants(config.tokenNames.clientLastName, ['Customer.LastName']), values.lastName);
  add(tokenVariants(config.tokenNames.clientCompany, ['Customer.Company']), values.company);
  add(
    tokenVariants(config.tokenNames.companyWebsite, ['Company website', '[Company website]']),
    values.website,
  );
  add(
    tokenVariants(config.tokenNames.proposalDate, ['[PROPOSAL DATE]', 'Proposal Date']),
    values.proposalDate,
  );
  add(
    tokenVariants(config.tokenNames.retainerAmount, [
      '[RETAINER AMOUNT]',
      'Retainer Amount',
      'retainer amount',
    ]),
    values.retainerAmount,
  );

  return entries;
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
  const retainerFormatted = formatUsd(activationFee);
  const retainerNumeric = String(activationFee);

  const images: Array<{ name: string; urls: string[] }> = [
    {
      name: config.logoImageBlockName,
      urls: [absoluteAssetUrl(site.logo)],
    },
  ];

  if (config.signatureImageBlockName) {
    images.push({
      name: config.signatureImageBlockName,
      urls: [absoluteAssetUrl('/brand/signature-michael-hart.png')],
    });
  }

  const fields: Record<string, { value: string | number | boolean }> = {};
  if (config.contractorDateFieldName) {
    fields[config.contractorDateFieldName] = {
      value: new Date().toISOString(),
    };
  }

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
    tokens: buildTokens(config, {
      firstName: firstName || submission.name,
      lastName: lastName || ' ',
      company,
      website: site.url,
      proposalDate: formatProposalDate(),
      retainerAmount: retainerFormatted,
    }).concat([
      // Some templates use a plain numeric token for payment display.
      { name: 'RETAINER AMOUNT NUMERIC', value: retainerNumeric },
    ]),
    fields: Object.keys(fields).length > 0 ? fields : undefined,
    images,
    metadata: {
      mh_submission_id: submission.id,
      mh_client_email: submission.email,
    },
    tags: ['mh-consulting', 'engagement-retainer'],
  };
}
