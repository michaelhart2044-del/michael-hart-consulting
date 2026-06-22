import { site } from '@/lib/site';

export interface PandaDocConfig {
  apiKey: string;
  templateUuid: string;
  clientRole: string;
  contractorRole: string;
  contractorEmail: string;
  /** When set, must match an Image block name in the PandaDoc template. */
  logoImageBlockName?: string;
  signatureImageBlockName?: string;
  contractorDateFieldName?: string;
  tokenNames: {
    clientFirstName: string;
    clientLastName: string;
    clientCompany: string;
    companyWebsite: string;
    proposalDate: string;
    retainerAmount: string;
  };
}

export type PandaDocConfigStatus =
  | { configured: true; config: PandaDocConfig }
  | { configured: false; missing: string[] };

function readTokenName(envKey: string, fallback: string): string {
  return process.env[envKey]?.trim() || fallback;
}

export function getPandaDocConfigStatus(): PandaDocConfigStatus {
  const missing: string[] = [];
  const apiKey = process.env.PANDADOC_API_KEY?.trim();
  const templateUuid = process.env.PANDADOC_TEMPLATE_UUID?.trim();

  if (!apiKey) missing.push('PANDADOC_API_KEY');
  if (!templateUuid) missing.push('PANDADOC_TEMPLATE_UUID');

  if (missing.length > 0) {
    return { configured: false, missing };
  }

  return {
    configured: true,
    config: {
      apiKey: apiKey!,
      templateUuid: templateUuid!,
      clientRole: process.env.PANDADOC_CLIENT_ROLE?.trim() || 'Customer',
      contractorRole: process.env.PANDADOC_CONTRACTOR_ROLE?.trim() || 'Contractor',
      contractorEmail: process.env.PANDADOC_CONTRACTOR_EMAIL?.trim() || site.email,
      logoImageBlockName: process.env.PANDADOC_LOGO_IMAGE_BLOCK_NAME?.trim() || undefined,
      signatureImageBlockName: process.env.PANDADOC_SIGNATURE_IMAGE_BLOCK_NAME?.trim() || undefined,
      contractorDateFieldName: process.env.PANDADOC_CONTRACTOR_DATE_FIELD?.trim() || undefined,
      tokenNames: {
        clientFirstName: readTokenName('PANDADOC_TOKEN_CLIENT_FIRST_NAME', 'Client.FirstName'),
        clientLastName: readTokenName('PANDADOC_TOKEN_CLIENT_LAST_NAME', 'Client.LastName'),
        clientCompany: readTokenName('PANDADOC_TOKEN_CLIENT_COMPANY', 'Client.Company'),
        companyWebsite: readTokenName('PANDADOC_TOKEN_COMPANY_WEBSITE', '[Company website]'),
        proposalDate: readTokenName('PANDADOC_TOKEN_PROPOSAL_DATE', 'PROPOSAL DATE'),
        retainerAmount: readTokenName('PANDADOC_TOKEN_RETAINER_AMOUNT', 'RETAINER AMOUNT'),
      },
    },
  };
}

export function pandaDocDocumentEditUrl(documentId: string): string {
  return `https://app.pandadoc.com/a/#/documents/${documentId}`;
}

export interface PandaDocBalanceConfig {
  apiKey: string;
  templateUuid: string;
  senderRole: string;
  clientRole: string;
  senderEmail: string;
  pricingTableName: string;
  logoImageBlockName?: string;
}

export type PandaDocBalanceConfigStatus =
  | { configured: true; config: PandaDocBalanceConfig }
  | { configured: false; missing: string[] };

export interface PandaDocNdaConfig {
  apiKey: string;
  templateUuid: string;
  /** PandaDoc default NDA roles — Owner (you) + Recipient (client). */
  ownerRole: string;
  recipientRole: string;
  /** Fallback when template uses Contractor/Customer instead of Owner/Recipient. */
  contractorRole: string;
  clientRole: string;
  contractorEmail: string;
  logoImageBlockName?: string;
}

export type PandaDocNdaConfigStatus =
  | { configured: true; config: PandaDocNdaConfig }
  | { configured: false; missing: string[] };

export function getPandaDocNdaConfigStatus(): PandaDocNdaConfigStatus {
  const missing: string[] = [];
  const apiKey = process.env.PANDADOC_API_KEY?.trim();
  const templateUuid = process.env.PANDADOC_TEMPLATE_NDA_UUID?.trim();

  if (!apiKey) missing.push('PANDADOC_API_KEY');
  if (!templateUuid) missing.push('PANDADOC_TEMPLATE_NDA_UUID');

  if (missing.length > 0) {
    return { configured: false, missing };
  }

  return {
    configured: true,
    config: {
      apiKey: apiKey!,
      templateUuid: templateUuid!,
      ownerRole: process.env.PANDADOC_NDA_OWNER_ROLE?.trim() || 'Owner',
      recipientRole: process.env.PANDADOC_NDA_RECIPIENT_ROLE?.trim() || 'Recipient',
      clientRole: process.env.PANDADOC_CLIENT_ROLE?.trim() || 'Customer',
      contractorRole: process.env.PANDADOC_CONTRACTOR_ROLE?.trim() || 'Contractor',
      contractorEmail: process.env.PANDADOC_CONTRACTOR_EMAIL?.trim() || site.email,
      logoImageBlockName: process.env.PANDADOC_LOGO_IMAGE_BLOCK_NAME?.trim() || undefined,
    },
  };
}

export function getPandaDocBalanceConfigStatus(): PandaDocBalanceConfigStatus {
  const missing: string[] = [];
  const apiKey = process.env.PANDADOC_API_KEY?.trim();
  const templateUuid = process.env.PANDADOC_TEMPLATE_BALANCE_UUID?.trim();

  if (!apiKey) missing.push('PANDADOC_API_KEY');
  if (!templateUuid) missing.push('PANDADOC_TEMPLATE_BALANCE_UUID');

  if (missing.length > 0) {
    return { configured: false, missing };
  }

  return {
    configured: true,
    config: {
      apiKey: apiKey!,
      templateUuid: templateUuid!,
      // Default to Contractor/Customer to match Engagement Activation Retainer; override via env if needed.
      senderRole:
        process.env.PANDADOC_INVOICE_SENDER_ROLE?.trim() ||
        process.env.PANDADOC_CONTRACTOR_ROLE?.trim() ||
        'Contractor',
      clientRole:
        process.env.PANDADOC_INVOICE_CLIENT_ROLE?.trim() ||
        process.env.PANDADOC_CLIENT_ROLE?.trim() ||
        'Customer',
      senderEmail: process.env.PANDADOC_CONTRACTOR_EMAIL?.trim() || site.email,
      pricingTableName:
        process.env.PANDADOC_BALANCE_PRICING_TABLE_NAME?.trim() || 'Pricing Table 1',
      logoImageBlockName: process.env.PANDADOC_LOGO_IMAGE_BLOCK_NAME?.trim() || undefined,
    },
  };
}
