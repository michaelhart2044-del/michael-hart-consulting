/**
 * Engagement Activation Index (EAI) — complexity scoring and recommended economics.
 */

import {
  labelForEntityCount,
  labelForFinanceTeamSize,
  labelForRevenueBand,
  type EntityCount,
  type FinanceTeamSize,
  type RevenueBand,
} from '@/lib/intake-options';

export type EngagementTier = 'foundation' | 'growth' | 'advanced' | 'specialist';

export type QuoteConfidence = 'high' | 'medium' | 'low';

export interface EngagementFactor {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
}

export interface EngagementQuoteComputed {
  eaiScore: number;
  tier: EngagementTier;
  tierLabel: string;
  activationFee: number;
  totalFee: number;
  balanceDue: number;
  creditPercent: number;
  confidence: QuoteConfidence;
  factors: EngagementFactor[];
  computedAt: string;
}

export interface EngagementQuoteStored extends EngagementQuoteComputed {
  activationFeeOverride?: number;
  totalFeeOverride?: number;
  notes?: string;
  savedAt?: string;
}

export interface EngagementPricingInput {
  industry?: string;
  revenueBand?: string;
  entityCount?: string;
  financeTeamSize?: string;
  peopleInvolved?: string;
  mainChallenge?: string;
  additionalChallenges?: string[];
  successLooksLike?: string;
  additionalContext?: string;
  consult30Transcript?: string;
}

const TIER_LABELS: Record<EngagementTier, string> = {
  foundation: 'Foundation',
  growth: 'Growth',
  advanced: 'Advanced',
  specialist: 'Specialist',
};

const TIER_PRICING: Record<EngagementTier, { activation: number; total: number }> = {
  foundation: { activation: 1900, total: 5000 },
  growth: { activation: 2900, total: 7500 },
  advanced: { activation: 4500, total: 12000 },
  specialist: { activation: 5500, total: 18000 },
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function combinedText(input: EngagementPricingInput): string {
  return [
    input.mainChallenge,
    ...(input.additionalChallenges ?? []),
    input.successLooksLike,
    input.additionalContext,
    input.consult30Transcript,
    input.industry,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function scoreIndustry(industry: string | undefined): number {
  const i = (industry ?? '').toLowerCase();
  if (/private equity|litigation|legal/.test(i)) return 10;
  if (/manufacturing|healthcare|technology|saas/.test(i)) return 7;
  if (/real estate|professional services/.test(i)) return 5;
  return 4;
}

function scoreRevenue(band: string | undefined): number {
  const map: Record<RevenueBand, number> = {
    under_5m: 2,
    '5m_25m': 6,
    '25m_100m': 10,
    over_100m: 12,
    prefer_not: 5,
  };
  return map[band as RevenueBand] ?? 5;
}

function scoreEntities(count: string | undefined): number {
  const map: Record<EntityCount, number> = {
    '1': 0,
    '2_3': 5,
    '4_plus': 10,
    not_sure: 2,
  };
  return map[count as EntityCount] ?? 2;
}

function scoreTeamSize(size: string | undefined, peopleInvolved: string | undefined): number {
  const map: Record<FinanceTeamSize, number> = {
    '1_2': 2,
    '3_5': 6,
    '6_plus': 10,
  };
  if (size && map[size as FinanceTeamSize] !== undefined) {
    return map[size as FinanceTeamSize];
  }
  const p = peopleInvolved ?? '';
  const nums = p.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return 3;
  const max = Math.max(...nums);
  if (max <= 2) return 2;
  if (max <= 5) return 6;
  return 10;
}

function scoreChallenges(main: string | undefined, additional: string[] | undefined): number {
  const text = [main, ...(additional ?? [])].join(' ').toLowerCase();
  let pts = 0;
  if (/sox|audit|compliance|control/.test(text)) pts += 8;
  if (/close|reconcil/.test(text)) pts += 5;
  if (/manual|spreadsheet|autom/.test(text)) pts += 4;
  if (/staff|capacity|team/.test(text)) pts += 3;
  if (/forecast|cash flow/.test(text)) pts += 3;
  if (/forensic|litigation|merger|acquisition|m&a/.test(text)) pts += 6;
  return Math.min(20, pts + Math.min(8, (additional?.length ?? 0) * 2));
}

function scoreCloseCycle(text: string): number {
  const range = text.match(/(\d{1,2})\s*[–-]\s*(\d{1,2})\s*(business\s*)?day/i);
  if (range) {
    const high = Math.max(Number(range[1]), Number(range[2]));
    if (high >= 13) return 15;
    if (high >= 9) return 10;
    return 5;
  }
  const single = text.match(/(\d{1,2})\s*(business\s*)?day/i);
  if (single) {
    const d = Number(single[1]);
    if (d >= 13) return 15;
    if (d >= 9) return 10;
    return 5;
  }
  return 0;
}

function scoreUrgency(text: string): number {
  let pts = 0;
  if (/pe\b|private equity|sponsor|board|acquisition|diligence|q[1-4]/.test(text)) pts += 6;
  if (/audit|sox|deadline|july|august|september|october|november|december|january|february|march|april|may|june/.test(text)) {
    pts += 5;
  }
  if (/urgent|rush|asap|immovable/.test(text)) pts += 4;
  return Math.min(15, pts);
}

function scoreSystems(text: string): number {
  let pts = 0;
  if (/intercompany|multi-entity|consolidation/.test(text)) pts += 5;
  if (/excel|spreadsheet|manual/.test(text)) pts += 3;
  if (/quickbooks|netsuite|sap|oracle|dynamics|peoplesoft|adp|blackline/.test(text)) pts += 2;
  if (/inventory|revenue recognition|asc 606/.test(text)) pts += 3;
  return Math.min(12, pts);
}

function scoreTranscriptBonus(transcript: string | undefined): number {
  if (!transcript || transcript.trim().length < 80) return 0;
  if (transcript.trim().length >= 800) return 6;
  return 3;
}

function tierFromScore(score: number, text: string): EngagementTier {
  if (/forensic|litigation support|expert witness|m&a due diligence|merger/.test(text) && score >= 55) {
    return 'specialist';
  }
  if (score >= 76) return 'specialist';
  if (score >= 51) return 'advanced';
  if (score >= 26) return 'growth';
  return 'foundation';
}

function confidenceFromInput(input: EngagementPricingInput, text: string): QuoteConfidence {
  const hasTranscript = (input.consult30Transcript?.trim().length ?? 0) >= 80;
  const hasRevenue = Boolean(input.revenueBand && input.revenueBand !== 'prefer_not');
  const hasTeam = Boolean(input.financeTeamSize || input.peopleInvolved?.trim());
  if (hasTranscript && hasRevenue && hasTeam) return 'high';
  if (hasTranscript || (hasRevenue && hasTeam)) return 'medium';
  return 'low';
}

export function computeEngagementQuote(input: EngagementPricingInput): EngagementQuoteComputed {
  const text = combinedText(input);

  const factors: EngagementFactor[] = [
    { id: 'industry', label: 'Industry profile', points: scoreIndustry(input.industry), maxPoints: 12 },
    { id: 'revenue', label: `Scale (${labelForRevenueBand(input.revenueBand)})`, points: scoreRevenue(input.revenueBand), maxPoints: 12 },
    { id: 'entities', label: `Structure (${labelForEntityCount(input.entityCount)})`, points: scoreEntities(input.entityCount), maxPoints: 10 },
    {
      id: 'team',
      label: `Finance team (${labelForFinanceTeamSize(input.financeTeamSize) || input.peopleInvolved || 'unknown'})`,
      points: scoreTeamSize(input.financeTeamSize, input.peopleInvolved),
      maxPoints: 10,
    },
    { id: 'challenges', label: 'Challenge severity', points: scoreChallenges(input.mainChallenge, input.additionalChallenges), maxPoints: 20 },
    { id: 'close', label: 'Close cycle pressure', points: scoreCloseCycle(text), maxPoints: 15 },
    { id: 'urgency', label: 'Urgency & stakeholders', points: scoreUrgency(text), maxPoints: 15 },
    { id: 'systems', label: 'Systems complexity', points: scoreSystems(text), maxPoints: 12 },
    { id: 'transcript', label: 'Consult depth (Layer 2)', points: scoreTranscriptBonus(input.consult30Transcript), maxPoints: 6 },
  ];

  const rawScore = factors.reduce((sum, f) => sum + f.points, 0);
  const maxScore = factors.reduce((sum, f) => sum + f.maxPoints, 0);
  const eaiScore = clamp(Math.round((rawScore / maxScore) * 100), 0, 100);

  const tier = tierFromScore(eaiScore, text);
  const pricing = TIER_PRICING[tier];
  const creditPercent = Math.round((pricing.activation / pricing.total) * 100);

  return {
    eaiScore,
    tier,
    tierLabel: TIER_LABELS[tier],
    activationFee: pricing.activation,
    totalFee: pricing.total,
    balanceDue: pricing.total - pricing.activation,
    creditPercent,
    confidence: confidenceFromInput(input, text),
    factors,
    computedAt: new Date().toISOString(),
  };
}

export function effectiveQuoteFees(quote: EngagementQuoteStored): {
  activationFee: number;
  totalFee: number;
  balanceDue: number;
  creditPercent: number;
} {
  const activationFee = quote.activationFeeOverride ?? quote.activationFee;
  const totalFee = quote.totalFeeOverride ?? quote.totalFee;
  const balanceDue = Math.max(0, totalFee - activationFee);
  const creditPercent = totalFee > 0 ? Math.round((activationFee / totalFee) * 100) : 0;
  return { activationFee, totalFee, balanceDue, creditPercent };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function buildPricingSummaryBlock(quote: EngagementQuoteStored): string {
  const { activationFee, totalFee, balanceDue } = effectiveQuoteFees(quote);
  return [
    'INVESTMENT — Engagement Activation Retainer (4–6 weeks)',
    `Fixed fee: ${formatUsd(totalFee)}.`,
    `Activation due at signing: ${formatUsd(activationFee)} (credited in full toward total).`,
    `Balance due upon delivery of executive summary: ${formatUsd(balanceDue)}.`,
  ].join('\n');
}
