import type { PrepSubmission } from '@/lib/submissions-store';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';
import { splitFullName } from '@/lib/split-full-name';
import { site } from '@/lib/site';
import type { PandaDocConfig } from '@/lib/pandadoc/config';
import type { PandaDocClientDetails } from '@/lib/pandadoc/client-details';
import type {
  PandaDocCreateDocumentBody,
  PandaDocTemplateImage,
} from '@/lib/pandadoc/client';
import { getTemplateDetails } from '@/lib/pandadoc/client';

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

function formatRetainerAmount(amount: number): string {
  // Template already includes "$" before the token — send digits only.
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
}

function buildTokens(
  config: PandaDocConfig,
  values: {
    firstName: string;
    lastName: string;
    company: string;
    email: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    website: string;
    proposalDate: string;
    retainerAmount: string;
    retainerAmountWithCurrency: string;
  },
): Array<{ name: string; value: string }> {
  const entries: Array<{ name: string; value: string }> = [];

  const add = (names: string[], value: string) => {
    for (const name of names) {
      entries.push({ name, value });
    }
  };

  const addIf = (names: string[], value: string | undefined) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    add(names, trimmed);
  };

  add(
    tokenVariants(config.tokenNames.clientFirstName, [
      'Customer.FirstName',
      'Client.FirstName',
      '[Client.FirstName]',
    ]),
    values.firstName,
  );
  add(
    tokenVariants(config.tokenNames.clientLastName, [
      'Customer.LastName',
      'Client.LastName',
      '[Client.LastName]',
    ]),
    values.lastName,
  );
  add(
    tokenVariants(config.tokenNames.clientCompany, [
      'Customer.Company',
      'Client.Company',
      '[Client.Company]',
    ]),
    values.company,
  );
  add(['Client.Email', 'Customer.Email', '[Client.Email]'], values.email);
  addIf(['Client.StreetAddress', '[Client.StreetAddress]'], values.streetAddress);
  addIf(['Client.City', '[Client.City]'], values.city);
  addIf(['Client.State', '[Client.State]'], values.state);
  addIf(['Client.PostalCode', '[Client.PostalCode]'], values.postalCode);
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
  add(['RETAINER AMOUNT WITH $', 'Retainer Amount (formatted)'], values.retainerAmountWithCurrency);

  return entries;
}

function namedTemplateImages(images: PandaDocTemplateImage[] = []): string[] {
  return images.map((img) => img.name?.trim()).filter((name): name is string => Boolean(name));
}

function pickLogoBlockName(
  templateImages: PandaDocTemplateImage[],
  explicitName?: string,
): string | undefined {
  const names = namedTemplateImages(templateImages);
  if (names.length === 0) return undefined;

  if (explicitName) {
    return names.includes(explicitName) ? explicitName : undefined;
  }

  const logoMatch = names.find((name) => /logo|brand|mh/i.test(name));
  return logoMatch ?? names[0];
}

async function buildRetainerImages(
  config: PandaDocConfig,
): Promise<Array<{ name: string; urls: string[] }>> {
  let templateImages: PandaDocTemplateImage[] = [];
  try {
    const template = await getTemplateDetails(config, config.templateUuid);
    templateImages = template.images ?? [];
  } catch {
    // Template details unavailable — skip images rather than fail draft creation.
    return [];
  }

  const templateImageNames = new Set(namedTemplateImages(templateImages));
  const images: Array<{ name: string; urls: string[] }> = [];

  const logoBlockName = pickLogoBlockName(templateImages, config.logoImageBlockName);
  if (logoBlockName && templateImageNames.has(logoBlockName)) {
    images.push({
      name: logoBlockName,
      // PandaDoc scales from source pixel dimensions — use compact asset for cover MH_Logo.
      urls: [absoluteAssetUrl(site.pandadocLogo)],
    });
  }

  if (
    config.signatureImageBlockName &&
    templateImageNames.has(config.signatureImageBlockName)
  ) {
    images.push({
      name: config.signatureImageBlockName,
      urls: [absoluteAssetUrl('/brand/signature-michael-hart.png')],
    });
  }

  return images;
}

export async function buildRetainerDocumentRequest(
  submission: PrepSubmission,
  config: PandaDocConfig,
  clientDetails: PandaDocClientDetails,
): Promise<PandaDocCreateDocumentBody> {
  if (!submission.engagementQuote?.savedAt) {
    throw new Error('Save the engagement quote in Engagement Economics before creating a PandaDoc retainer.');
  }

  const { firstName, lastName } = splitFullName(submission.name);
  const { activationFee } = effectiveQuoteFees(submission.engagementQuote);
  if (!Number.isFinite(activationFee) || activationFee <= 0) {
    throw new Error('Activation retainer amount must be greater than $0.');
  }

  const company =
    clientDetails.company?.trim() ||
    submission.clientCompany?.trim() ||
    submission.industry?.trim() ||
    '';
  if (!company) {
    throw new Error('Client company is required before creating a PandaDoc retainer.');
  }
  const streetAddress = clientDetails.streetAddress?.trim() || submission.clientStreetAddress;
  const city = clientDetails.city?.trim() || submission.clientCity;
  const state = clientDetails.state?.trim() || submission.clientState;
  const postalCode = clientDetails.postalCode?.trim() || submission.clientPostalCode;
  const documentName = `Engagement Activation Retainer — ${submission.name}`;
  const retainerPlain = formatRetainerAmount(activationFee);
  const retainerFormatted = formatUsd(activationFee);
  const retainerNumeric = String(activationFee);

  const images = await buildRetainerImages(config);

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
      email: submission.email,
      streetAddress,
      city,
      state,
      postalCode,
      website: site.url,
      proposalDate: formatProposalDate(),
      retainerAmount: retainerPlain,
      retainerAmountWithCurrency: retainerFormatted,
    }).concat([
      { name: 'RETAINER AMOUNT NUMERIC', value: retainerNumeric },
    ]),
    fields: Object.keys(fields).length > 0 ? fields : undefined,
    images: images.length > 0 ? images : undefined,
    metadata: {
      mh_submission_id: submission.id,
      mh_client_email: submission.email,
    },
    tags: ['mh-consulting', 'engagement-retainer'],
  };
}
