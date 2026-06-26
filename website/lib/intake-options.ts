/**
 * Shared intake dropdown options — public form, admin, and EAI scoring.
 */

export const REVENUE_BAND_OPTIONS = [
  { value: 'under_5m', label: 'Under $5M' },
  { value: '5m_25m', label: '$5M – $25M' },
  { value: '25m_100m', label: '$25M – $100M' },
  { value: 'over_100m', label: '$100M+' },
  { value: 'prefer_not', label: 'Prefer not to say' },
] as const;

export const ENTITY_COUNT_OPTIONS = [
  { value: '1', label: '1 company' },
  { value: '2_3', label: '2–3 entities' },
  { value: '4_plus', label: '4+ entities' },
  { value: 'not_sure', label: 'Not sure' },
] as const;

export const FINANCE_TEAM_SIZE_OPTIONS = [
  { value: '1_2', label: '1–2 people' },
  { value: '3_5', label: '3–5 people' },
  { value: '6_plus', label: '6+ people' },
] as const;

export type RevenueBand = (typeof REVENUE_BAND_OPTIONS)[number]['value'];
export type EntityCount = (typeof ENTITY_COUNT_OPTIONS)[number]['value'];
export type FinanceTeamSize = (typeof FINANCE_TEAM_SIZE_OPTIONS)[number]['value'];

export function labelForRevenueBand(value: string | undefined): string {
  return REVENUE_BAND_OPTIONS.find((o) => o.value === value)?.label ?? value ?? 'Not provided';
}

export function labelForEntityCount(value: string | undefined): string {
  return ENTITY_COUNT_OPTIONS.find((o) => o.value === value)?.label ?? value ?? 'Not sure';
}

export function labelForFinanceTeamSize(value: string | undefined): string {
  return FINANCE_TEAM_SIZE_OPTIONS.find((o) => o.value === value)?.label ?? value ?? 'Not provided';
}

/** Legacy `peopleInvolved` text for proposals when only team size dropdown exists. */
export function financeTeamSizeToPeopleInvolved(value: string | undefined): string {
  return labelForFinanceTeamSize(value);
}

/** How the lead heard about MH Consulting — optional intake attribution. */
export const LEAD_SOURCE_OPTIONS = [
  { value: 'google_search', label: 'Google / search' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Referral from someone I know' },
  { value: 'past_client', label: 'Past client / worked together before' },
  { value: 'conference', label: 'Conference or event' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not', label: 'Prefer not to say' },
] as const;

export type LeadSource = (typeof LEAD_SOURCE_OPTIONS)[number]['value'];

export function labelForLeadSource(value: string | undefined): string {
  if (!value?.trim()) return 'Not provided';
  return LEAD_SOURCE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Human-readable block for emails, bundles, and admin. */
export function formatLeadSourceAttribution(input: {
  leadSource?: string;
  leadSourceDetail?: string;
  referrerName?: string;
  referrerEmail?: string;
}): string {
  const source = labelForLeadSource(input.leadSource);
  if (!input.leadSource || input.leadSource === 'prefer_not') {
    return input.leadSource === 'prefer_not' ? 'Prefer not to say' : 'Not provided';
  }
  const parts = [source];
  if (input.leadSource === 'referral') {
    if (input.referrerName?.trim()) parts.push(`Referrer: ${input.referrerName.trim()}`);
    if (input.referrerEmail?.trim()) parts.push(`Referrer email: ${input.referrerEmail.trim()}`);
  } else if (input.leadSource === 'other' && input.leadSourceDetail?.trim()) {
    parts.push(input.leadSourceDetail.trim());
  }
  return parts.join(' · ');
}
