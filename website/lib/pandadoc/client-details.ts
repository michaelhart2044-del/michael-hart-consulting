/** Client fields collected in admin before creating a PandaDoc retainer draft. */
export interface PandaDocClientDetails {
  company: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export function clientDetailsFromSubmission(submission: {
  clientCompany?: string;
  clientStreetAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientPostalCode?: string;
  industry?: string;
}): PandaDocClientDetails {
  return {
    company: submission.clientCompany || submission.industry || '',
    streetAddress: submission.clientStreetAddress,
    city: submission.clientCity,
    state: submission.clientState,
    postalCode: submission.clientPostalCode,
  };
}
