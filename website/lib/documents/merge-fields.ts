import type { PrepSubmission } from '@/lib/submissions-store';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';
import { splitFullName } from '@/lib/split-full-name';
import { contractorProfile } from '@/lib/pandadoc/contractor';
import { site } from '@/lib/site';
import type { PandaDocClientDetails } from '@/lib/pandadoc/client-details';

export interface DocumentMergeFields {
  agreementDate: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerCompany: string;
  ownerState: string;
  ownerEmail: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientCompany: string;
  recipientEmail: string;
  recipientStreetAddress?: string;
  recipientCity?: string;
  recipientState?: string;
  recipientPostalCode?: string;
  activationFee?: number;
  activationFeeFormatted?: string;
  totalPhase1Fee?: number;
  totalPhase1Formatted?: string;
  balanceDue?: number;
  balanceDueFormatted?: string;
  activationCredited?: string;
  proposalDate?: string;
  website: string;
}

function formatDollarPlain(amount: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
}

function formatAgreementDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function buildDocumentMergeFields(
  submission: PrepSubmission,
  clientDetails: PandaDocClientDetails,
): DocumentMergeFields {
  const { firstName, lastName } = splitFullName(submission.name);
  const company =
    clientDetails.company?.trim() ||
    submission.clientCompany?.trim() ||
    submission.industry?.trim() ||
    '';

  const fields: DocumentMergeFields = {
    agreementDate: formatAgreementDate(),
    ownerFirstName: contractorProfile.firstName,
    ownerLastName: contractorProfile.lastName,
    ownerCompany: contractorProfile.company,
    ownerState: contractorProfile.state,
    ownerEmail: contractorProfile.email,
    recipientFirstName: firstName || submission.name,
    recipientLastName: lastName || ' ',
    recipientCompany: company,
    recipientEmail: submission.email,
    recipientStreetAddress: clientDetails.streetAddress?.trim() || submission.clientStreetAddress,
    recipientCity: clientDetails.city?.trim() || submission.clientCity,
    recipientState: clientDetails.state?.trim() || submission.clientState,
    recipientPostalCode: clientDetails.postalCode?.trim() || submission.clientPostalCode,
    website: site.url,
  };

  if (submission.engagementQuote?.savedAt) {
    const fees = effectiveQuoteFees(submission.engagementQuote);
    fields.activationFee = fees.activationFee;
    fields.activationFeeFormatted = formatUsd(fees.activationFee);
    fields.totalPhase1Fee = fees.totalFee;
    fields.totalPhase1Formatted = formatUsd(fees.totalFee);
    fields.balanceDue = fees.balanceDue;
    fields.balanceDueFormatted = formatUsd(fees.balanceDue);
    fields.activationCredited = `${fees.creditPercent}%`;
    fields.proposalDate = formatAgreementDate();
  }

  return fields;
}

/** Flat map for SignWell template custom fields / mail merge. */
export function mergeFieldsToTokenMap(fields: DocumentMergeFields): Record<string, string> {
  const map: Record<string, string> = {
    'Owner.FirstName': fields.ownerFirstName,
    'Owner.LastName': fields.ownerLastName,
    'Owner.Company': fields.ownerCompany,
    'Owner.State': fields.ownerState,
    'Owner.Email': fields.ownerEmail,
    'Recipient.FirstName': fields.recipientFirstName,
    'Recipient.LastName': fields.recipientLastName,
    'Recipient.Company': fields.recipientCompany,
    'Recipient.Email': fields.recipientEmail,
    Date: fields.agreementDate,
    'Company website': fields.website,
  };
  if (fields.recipientStreetAddress) map['Recipient.StreetAddress'] = fields.recipientStreetAddress;
  if (fields.recipientCity) map['Recipient.City'] = fields.recipientCity;
  if (fields.recipientState) map['Recipient.State'] = fields.recipientState;
  if (fields.recipientPostalCode) map['Recipient.PostalCode'] = fields.recipientPostalCode;
  if (fields.activationFeeFormatted) map['RETAINER AMOUNT'] = fields.activationFeeFormatted;
  if (fields.totalPhase1Formatted) map['TOTAL PHASE 1 FEE'] = fields.totalPhase1Formatted;
  if (fields.balanceDueFormatted) map['BALANCE DUE'] = fields.balanceDueFormatted;
  return map;
}

function addAliases(map: Record<string, string>, names: string[], value: string) {
  const trimmed = value?.trim();
  if (!trimmed) return;
  for (const name of names) map[name] = trimmed;
}

/** All bracket / brace tokens to replace inside source PDFs before SignWell upload. */
export function mergeFieldsToPdfTokenMap(fields: DocumentMergeFields): Record<string, string> {
  const map = mergeFieldsToTokenMap(fields);

  addAliases(map, ['Document.CreatedDate', 'Document.Created Date'], fields.agreementDate);
  addAliases(map, ['Client.FirstName', 'Customer.FirstName'], fields.recipientFirstName);
  addAliases(map, ['Client.LastName', 'Customer.LastName'], fields.recipientLastName);
  addAliases(map, ['Client.Company', 'Customer.Company'], fields.recipientCompany);
  addAliases(map, ['Client.Email', 'Customer.Email'], fields.recipientEmail);
  addAliases(map, ['Contractor.FirstName'], fields.ownerFirstName);
  addAliases(map, ['Contractor.LastName'], fields.ownerLastName);

  map['Company website'] = fields.website
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/$/, '');

  // Combined display values for grouped PDF overlays
  map['Recipient.FullName'] = `${fields.recipientFirstName} ${fields.recipientLastName}`.trim();
  map['Owner.FullName'] = `${fields.ownerFirstName} ${fields.ownerLastName}`.trim();
  map['Owner.StateLabel'] = `State: ${fields.ownerState}`;

  if (fields.recipientStreetAddress) {
    addAliases(map, ['Client.StreetAddress'], fields.recipientStreetAddress);
  }
  if (fields.recipientCity) addAliases(map, ['Client.City'], fields.recipientCity);
  if (fields.recipientState) addAliases(map, ['Client.State'], fields.recipientState);
  if (fields.recipientPostalCode) addAliases(map, ['Client.PostalCode'], fields.recipientPostalCode);

  if (fields.activationFee != null && fields.totalPhase1Fee != null && fields.balanceDue != null) {
    map['RETAINER AMOUNT'] = formatDollarPlain(fields.activationFee);
    map['TOTAL PHASE 1 FEE'] = formatDollarPlain(fields.totalPhase1Fee);
    map['BALANCE DUE AT DELIVERY'] = formatDollarPlain(fields.balanceDue);
    map['BALANCE DUE'] = formatDollarPlain(fields.balanceDue);
    if (fields.activationCredited) map['ACTIVATION CREDITED'] = fields.activationCredited;
    if (fields.proposalDate) map['PROPOSAL DATE'] = fields.proposalDate;
  }

  return map;
}
