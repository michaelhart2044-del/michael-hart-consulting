import type { PrepSubmission } from '@/lib/submissions-store';
import { effectiveQuoteFees } from '@/lib/engagement-pricing';
import { splitFullName } from '@/lib/split-full-name';
import { site } from '@/lib/site';
import type { PandaDocBalanceConfig } from '@/lib/pandadoc/config';
import { getPandaDocConfigStatus } from '@/lib/pandadoc/config';
import type { PandaDocClientDetails } from '@/lib/pandadoc/client-details';
import type {
  PandaDocCreateDocumentBody,
  PandaDocTemplateDetails,
  PandaDocTemplateImage,
} from '@/lib/pandadoc/client';
import { getTemplateDetails } from '@/lib/pandadoc/client';
import { contractorProfile } from '@/lib/pandadoc/contractor';

function absoluteAssetUrl(path: string): string {
  const base = site.url.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

function formatInvoiceDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function addDueDate(daysFromNow = 15, from = new Date()): string {
  const due = new Date(from);
  due.setDate(due.getDate() + daysFromNow);
  return formatInvoiceDate(due);
}

function buildInvoiceNumber(submissionId: string): string {
  const year = new Date().getFullYear();
  const suffix = submissionId.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
  return `MH-${year}-${suffix}`;
}

function formatContractReference(submission: PrepSubmission): string {
  const retainerDate = submission.pandadocRetainer?.createdAt || submission.engagementCommittedAt;
  if (retainerDate) {
    return `Engagement Activation Retainer dated ${formatInvoiceDate(new Date(retainerDate))}`;
  }
  return 'Engagement Activation Retainer';
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
  if (explicitName && names.includes(explicitName)) return explicitName;
  return names.find((name) => /logo|brand|mh/i.test(name)) ?? names[0];
}

async function fetchBalanceTemplateDetails(
  config: PandaDocBalanceConfig,
): Promise<PandaDocTemplateDetails | null> {
  const base = getPandaDocConfigStatus();
  if (!base.configured) return null;

  try {
    return await getTemplateDetails(base.config, config.templateUuid);
  } catch {
    return null;
  }
}

function buildBalanceImagesFromTemplate(
  template: PandaDocTemplateDetails | null,
  config: PandaDocBalanceConfig,
): Array<{ name: string; urls: string[] }> {
  const templateImages = template?.images ?? [];
  if (templateImages.length === 0) return [];

  const logoBlockName = pickLogoBlockName(templateImages, config.logoImageBlockName);
  if (!logoBlockName) return [];

  return [
    {
      name: logoBlockName,
      urls: [absoluteAssetUrl(site.pandadocLogo)],
    },
  ];
}

/** Resolve pricing table name from template details; prefer explicit config when it matches. */
function resolvePricingTableName(
  template: PandaDocTemplateDetails | null,
  configuredName: string,
): string {
  const tables = template?.pricing?.tables ?? [];
  if (tables.length === 0) return configuredName;

  const exact = tables.find((table) => table.name === configuredName);
  return exact?.name ?? tables[0]?.name ?? configuredName;
}

/** PandaDoc defaults to "Sample Section" when the quote section has no custom title. */
function resolvePricingSectionTitle(template: PandaDocTemplateDetails | null): string {
  const quoteSections = template?.pricing?.quotes?.flatMap((quote) => quote.sections ?? []) ?? [];
  const named = quoteSections.map((section) => section.name?.trim()).find(Boolean);
  return named || 'Sample Section';
}

function buildBalanceTokens(values: {
  clientFirstName: string;
  clientLastName: string;
  company: string;
  email: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  invoiceNo: string;
  invoiceTerms: string;
  invoiceDueDate: string;
  identifiedContract: string;
}): Array<{ name: string; value: string }> {
  const entries: Array<{ name: string; value: string }> = [];
  const add = (names: string[], value: string) => {
    for (const name of names) entries.push({ name, value });
  };
  const addIf = (names: string[], value: string | undefined) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    add(names, trimmed);
  };

  add(['Sender.FirstName', '[Sender.FirstName]'], contractorProfile.firstName);
  add(['Sender.LastName', '[Sender.LastName]'], contractorProfile.lastName);
  add(
    ['Sender.StreetAddress', '[Sender.StreetAddress]'],
    contractorProfile.streetAddress,
  );
  add(['Sender.City', '[Sender.City]'], contractorProfile.city);
  add(['Sender.State', '[Sender.State]'], contractorProfile.state);
  add(['Sender.PostalCode', '[Sender.PostalCode]'], contractorProfile.postalCode);
  add(['Sender.Phone', '[Sender.Phone]'], contractorProfile.phone);

  add(['Client.FirstName', '[Client.FirstName]'], values.clientFirstName);
  add(['Client.LastName', '[Client.LastName]'], values.clientLastName);
  add(['Client.Company', '[Client.Company]'], values.company);
  add(['Client.Email', '[Client.Email]'], values.email);
  addIf(['Client.StreetAddress', '[Client.StreetAddress]'], values.streetAddress);
  addIf(['Client.City', '[Client.City]'], values.city);
  addIf(['Client.State', '[Client.State]'], values.state);
  addIf(['Client.PostalCode', '[Client.PostalCode]'], values.postalCode);

  add(['Invoice.No', '[Invoice.No]', 'Invoce.No', '[Invoce.No]'], values.invoiceNo);
  add(['Invoice.Terms', '[Invoice.Terms]'], values.invoiceTerms);
  add(['Invoice.DueDate', '[Invoice.DueDate]'], values.invoiceDueDate);
  add(
    ['IdentifiedContract', '[IdentifiedContract]', 'IdentifielContract', '[IdentifielContract]'],
    values.identifiedContract,
  );

  return entries;
}

export async function buildBalanceDocumentRequest(
  submission: PrepSubmission,
  config: PandaDocBalanceConfig,
  clientDetails: PandaDocClientDetails,
): Promise<PandaDocCreateDocumentBody> {
  if (!submission.engagementQuote?.savedAt) {
    throw new Error('Save the engagement quote in Engagement Economics before creating a final balance invoice.');
  }

  if (!submission.engagementCommittedAt) {
    throw new Error('Mark Step 8 (agreement and payment received) before generating the final balance invoice.');
  }

  const { balanceDue } = effectiveQuoteFees(submission.engagementQuote);
  if (!Number.isFinite(balanceDue) || balanceDue <= 0) {
    throw new Error('Balance due at delivery must be greater than $0.');
  }

  const { firstName, lastName } = splitFullName(submission.name);
  const company =
    clientDetails.company?.trim() ||
    submission.clientCompany?.trim() ||
    submission.industry?.trim() ||
    '';
  if (!company) {
    throw new Error('Client company is required before creating a final balance invoice.');
  }

  const streetAddress = clientDetails.streetAddress?.trim() || submission.clientStreetAddress;
  const city = clientDetails.city?.trim() || submission.clientCity;
  const state = clientDetails.state?.trim() || submission.clientState;
  const postalCode = clientDetails.postalCode?.trim() || submission.clientPostalCode;

  const invoiceNo = buildInvoiceNumber(submission.id);
  const invoiceTerms = 'Net 15';
  const invoiceDueDate = addDueDate(15);
  const identifiedContract = formatContractReference(submission);
  const productName =
    'Phase 1 balance — Engagement Activation Retainer (balance due at delivery)';

  const template = await fetchBalanceTemplateDetails(config);
  const pricingTableName = resolvePricingTableName(template, config.pricingTableName);
  const pricingSectionTitle = resolvePricingSectionTitle(template);
  const images = buildBalanceImagesFromTemplate(template, config);

  return {
    name: `Services Invoice — Final Balance — ${submission.name}`,
    template_uuid: config.templateUuid,
    recipients: [
      {
        email: config.senderEmail,
        first_name: contractorProfile.firstName,
        last_name: contractorProfile.lastName,
        role: config.senderRole,
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
    tokens: buildBalanceTokens({
      clientFirstName: firstName || submission.name,
      clientLastName: lastName || ' ',
      company,
      email: submission.email,
      streetAddress,
      city,
      state,
      postalCode,
      invoiceNo,
      invoiceTerms,
      invoiceDueDate,
      identifiedContract,
    }),
    pricing_tables: [
      {
        name: pricingTableName,
        // Standard row fields — no template data-merge toggle required (unlike Name/Price/QTY with data_merge: true).
        data_merge: false,
        sections: [
          {
            title: pricingSectionTitle,
            default: true,
            rows: [
              {
                options: {
                  optional: true,
                  optional_selected: true,
                  qty_editable: false,
                },
                data: {
                  name: productName,
                  price: balanceDue,
                  qty: 1,
                },
              },
            ],
          },
        ],
      },
    ],
    images: images.length > 0 ? images : undefined,
    metadata: {
      mh_submission_id: submission.id,
      mh_client_email: submission.email,
      mh_document_type: 'final_balance',
    },
    tags: ['mh-consulting', 'final-balance-invoice'],
  };
}
