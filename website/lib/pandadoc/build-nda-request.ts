import type { PrepSubmission } from '@/lib/submissions-store';
import { splitFullName } from '@/lib/split-full-name';
import { site } from '@/lib/site';
import type { PandaDocNdaConfig, PandaDocConfig } from '@/lib/pandadoc/config';
import type { PandaDocClientDetails } from '@/lib/pandadoc/client-details';
import type {
  PandaDocCreateDocumentBody,
  PandaDocTemplateDetails,
  PandaDocTemplateImage,
} from '@/lib/pandadoc/client';
import { getTemplateDetails } from '@/lib/pandadoc/client';
import { contractorProfile } from '@/lib/pandadoc/contractor';

function pandadocApiConfig(config: PandaDocNdaConfig): PandaDocConfig {
  return { apiKey: config.apiKey } as PandaDocConfig;
}

function formatAgreementDate(date = new Date()): string {
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

function isCcRole(roleName: string): boolean {
  return /\sCC$/i.test(roleName.trim()) || /^cc\b/i.test(roleName.trim());
}

/** Resolve Owner/Recipient (PandaDoc NDA default) or Contractor/Customer fallbacks. */
function resolveNdaRecipientRoles(
  template: PandaDocTemplateDetails | null,
  config: PandaDocNdaConfig,
): { ownerRole: string; recipientRole: string } {
  const roleNames = (template?.roles ?? [])
    .map((role) => role.name?.trim())
    .filter((name): name is string => Boolean(name));

  if (roleNames.length === 0) {
    return { ownerRole: config.ownerRole, recipientRole: config.recipientRole };
  }

  const signerRoles = roleNames.filter((name) => !isCcRole(name));
  if (signerRoles.length === 0) {
    throw new Error(
      `This NDA template only has CC roles (${roleNames.join(', ')}). Use Owner + Recipient signing roles.`,
    );
  }

  const ownerRole =
    roleNames.find((name) => name === config.ownerRole) ??
    roleNames.find((name) => /^owner$/i.test(name)) ??
    roleNames.find((name) => name === config.contractorRole) ??
    roleNames.find((name) => /^contractor$/i.test(name)) ??
    roleNames.find((name) => /^sender$/i.test(name)) ??
    signerRoles[0];

  const recipientRole =
    roleNames.find((name) => name === config.recipientRole) ??
    roleNames.find((name) => /^recipient$/i.test(name)) ??
    roleNames.find((name) => name === config.clientRole) ??
    signerRoles.find((name) => /^customer$/i.test(name)) ??
    signerRoles.find((name) => /^client(\s|$| signer)/i.test(name)) ??
    signerRoles.find((name) => /recipient|client|customer/i.test(name)) ??
    signerRoles[signerRoles.length - 1];

  if (!recipientRole || isCcRole(recipientRole) || recipientRole === ownerRole) {
    throw new Error(
      `No signing recipient role found on the NDA template (roles: ${roleNames.join(', ')}). Use Owner + Recipient.`,
    );
  }

  return { ownerRole, recipientRole };
}

function normalizeTokenKey(name: string): string {
  return name.replace(/[\[\]]/g, '').toLowerCase().replace(/[._\s-]+/g, '');
}

function mergeTemplateTokenNames(
  template: PandaDocTemplateDetails | null,
  entries: Array<{ name: string; value: string }>,
): Array<{ name: string; value: string }> {
  const templateTokens = template?.tokens ?? [];
  if (templateTokens.length === 0) return entries;

  const valueByKey = new Map<string, string>();
  for (const entry of entries) {
    valueByKey.set(normalizeTokenKey(entry.name), entry.value);
  }

  const seen = new Set<string>();
  const merged: Array<{ name: string; value: string }> = [];

  for (const entry of entries) {
    if (seen.has(entry.name)) continue;
    seen.add(entry.name);
    merged.push(entry);
  }

  for (const token of templateTokens) {
    const name = token.name?.trim();
    if (!name || seen.has(name)) continue;
    const value = valueByKey.get(normalizeTokenKey(name));
    if (!value) continue;
    seen.add(name);
    merged.push({ name, value });
  }

  return merged;
}

function buildNdaTokens(values: {
  template?: PandaDocTemplateDetails | null;
  clientFirstName: string;
  clientLastName: string;
  company: string;
  email: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  agreementDate: string;
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

  // PandaDoc default NDA template — Owner (Michael) + Recipient (client)
  add(['Owner.FirstName', '[Owner.FirstName]'], contractorProfile.firstName);
  add(['Owner.LastName', '[Owner.LastName]'], contractorProfile.lastName);
  add(['Owner.Company', '[Owner.Company]'], contractorProfile.company);
  add(['Owner.State', '[Owner.State]'], contractorProfile.state);
  add(['Owner.Email', '[Owner.Email]'], contractorProfile.email);

  add(['Recipient.FirstName', '[Recipient.FirstName]'], values.clientFirstName);
  add(['Recipient.LastName', '[Recipient.LastName]'], values.clientLastName);
  add(['Recipient.Company', '[Recipient.Company]'], values.company);
  add(['Recipient.Email', '[Recipient.Email]'], values.email);
  addIf(['Recipient.StreetAddress', '[Recipient.StreetAddress]'], values.streetAddress);
  addIf(['Recipient.City', '[Recipient.City]'], values.city);
  addIf(['Recipient.State', '[Recipient.State]'], values.state);
  addIf(['Recipient.PostalCode', '[Recipient.PostalCode]'], values.postalCode);

  // Aliases for custom or retainer-aligned templates
  add(['Contractor.FirstName', '[Contractor.FirstName]'], contractorProfile.firstName);
  add(['Contractor.LastName', '[Contractor.LastName]'], contractorProfile.lastName);
  add(['Contractor.Company', '[Contractor.Company]'], contractorProfile.company);
  add(['Client.FirstName', '[Client.FirstName]'], values.clientFirstName);
  add(['Client.LastName', '[Client.LastName]'], values.clientLastName);
  add(['Customer.FirstName', '[Customer.FirstName]'], values.clientFirstName);
  add(['Customer.LastName', '[Customer.LastName]'], values.clientLastName);
  add(['Client.Company', '[Client.Company]'], values.company);
  add(['Customer.Company', '[Customer.Company]'], values.company);

  add(['Company website', '[Company website]'], site.url);
  add(['Date', '[Date]'], values.agreementDate);
  add(
    ['Document.CreatedDate', '[Document.CreatedDate]', 'Document.Created Date'],
    values.agreementDate,
  );
  add(
    ['AGREEMENT DATE', '[AGREEMENT DATE]', 'NDA DATE', '[NDA DATE]', 'Effective Date', '[Effective Date]'],
    values.agreementDate,
  );

  return mergeTemplateTokenNames(values.template ?? null, entries);
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

async function buildNdaImages(
  config: PandaDocNdaConfig,
): Promise<Array<{ name: string; urls: string[] }>> {
  try {
    const template = await getTemplateDetails(pandadocApiConfig(config), config.templateUuid);
    const templateImages = template.images ?? [];
    const logoBlockName = pickLogoBlockName(templateImages, config.logoImageBlockName);
    if (!logoBlockName) return [];
    return [{ name: logoBlockName, urls: [absoluteAssetUrl(site.pandadocLogo)] }];
  } catch {
    return [];
  }
}

export async function buildNdaDocumentRequest(
  submission: PrepSubmission,
  config: PandaDocNdaConfig,
  clientDetails: PandaDocClientDetails,
): Promise<PandaDocCreateDocumentBody> {
  const { firstName, lastName } = splitFullName(submission.name);
  const company =
    clientDetails.company?.trim() ||
    submission.clientCompany?.trim() ||
    submission.industry?.trim() ||
    '';
  if (!company) {
    throw new Error('Client company is required before creating an NDA.');
  }

  const streetAddress = clientDetails.streetAddress?.trim() || submission.clientStreetAddress;
  const city = clientDetails.city?.trim() || submission.clientCity;
  const state = clientDetails.state?.trim() || submission.clientState;
  const postalCode = clientDetails.postalCode?.trim() || submission.clientPostalCode;
  const agreementDate = formatAgreementDate();

  const template = await getTemplateDetails(pandadocApiConfig(config), config.templateUuid);
  const { ownerRole, recipientRole } = resolveNdaRecipientRoles(template, config);
  const images = await buildNdaImages(config);

  return {
    name: `Non-Disclosure Agreement — ${submission.name}`,
    template_uuid: config.templateUuid,
    recipients: [
      {
        email: config.contractorEmail,
        first_name: contractorProfile.firstName,
        last_name: contractorProfile.lastName,
        role: ownerRole,
        signing_order: 1,
      },
      {
        email: submission.email,
        first_name: firstName || submission.name,
        last_name: lastName || ' ',
        role: recipientRole,
        signing_order: 2,
      },
    ],
    tokens: buildNdaTokens({
      template,
      clientFirstName: firstName || submission.name,
      clientLastName: lastName || ' ',
      company,
      email: submission.email,
      streetAddress,
      city,
      state,
      postalCode,
      agreementDate,
    }),
    images: images.length > 0 ? images : undefined,
    metadata: {
      mh_submission_id: submission.id,
      mh_client_email: submission.email,
      mh_document_type: 'nda',
    },
    tags: ['mh-consulting', 'nda'],
  };
}
