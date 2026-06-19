/**
 * Inject saved engagement economics into client-facing proposal text.
 */

import {
  buildPricingSummaryBlock,
  effectiveQuoteFees,
  formatUsd,
  type EngagementQuoteStored,
} from '@/lib/engagement-pricing';
import type { GeneratedProposal } from '@/lib/proposal-generator';

const INVESTMENT_HEADER = /INVESTMENT\s*[—–-]\s*Engagement Activation Retainer/i;
const CLEAR_NEXT_STEPS = /(\n[ \t]*Clear next steps\b[^\n]*)/i;

/** Grok sometimes echoes fee lines from the prompt — remove before injecting the canonical block. */
export function stripPricingSection(text: string): string {
  let cleaned = text;

  // Full INVESTMENT block (ours or pasted)
  cleaned = cleaned.replace(
    /\n*INVESTMENT\s*[—–-]\s*Engagement Activation Retainer[^\n]*\n[\s\S]*?(?=\n[ \t]*(?:Clear next steps\b|\d+\.\s|I['']m looking forward|Michael Hart\b)|$)/gi,
    '',
  );

  // Standalone fee lines (from Grok echoing approved economics)
  cleaned = cleaned.replace(/\n[ \t]*Fixed fee:\s*\$[\d,]+(?:\.\d+)?\.?\s*/gi, '\n');
  cleaned = cleaned.replace(
    /\n[ \t]*Activation due at signing:\s*\$[\d,]+(?:\.\d+)?[^\n]*\n?/gi,
    '\n',
  );
  cleaned = cleaned.replace(
    /\n[ \t]*Balance due upon delivery[^\n]*:\s*\$[\d,]+(?:\.\d+)?\.?\s*/gi,
    '\n',
  );

  // Narrative fee sentence Grok adds (often inline after Clear next steps)
  cleaned = cleaned.replace(
    /\s*The activation retainer is structured with \$[\d,]+(?:\.\d+)? due at signing[\s\S]*?\.\s*/gi,
    ' ',
  );

  cleaned = cleaned.replace(
    /\n*This retainer is designed to stand alone or serve as the on-ramp[\s\S]*?confirmed after the initial consultation and data review\.\n?/i,
    '\n',
  );

  // Fix prior corruption: "Clear next steps2,000." → "Clear next steps:"
  cleaned = cleaned.replace(/Clear next steps[\d,]+(?:\.\d+)?\.\s*/gi, 'Clear next steps: ');

  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

function insertPricingBlock(section: string, pricingBlock: string): string {
  const cleaned = stripPricingSection(section);

  const clearMatch = cleaned.match(CLEAR_NEXT_STEPS);
  if (clearMatch && clearMatch.index != null) {
    const before = cleaned.slice(0, clearMatch.index).trimEnd();
    const after = cleaned.slice(clearMatch.index).trimStart();
    return `${before}\n\n${pricingBlock}\n\n${after}`.trim();
  }

  const signoffMatch = cleaned.match(/\n[ \t]*I['']m looking forward/i);
  if (signoffMatch && signoffMatch.index != null) {
    const before = cleaned.slice(0, signoffMatch.index).trimEnd();
    const after = cleaned.slice(signoffMatch.index).trimStart();
    return `${before}\n\n${pricingBlock}\n\n${after}`.trim();
  }

  const michaelMatch = cleaned.match(/\n[ \t]*Michael Hart\s*$/i);
  if (michaelMatch && michaelMatch.index != null) {
    const before = cleaned.slice(0, michaelMatch.index).trimEnd();
    const after = cleaned.slice(michaelMatch.index).trimStart();
    return `${before}\n\n${pricingBlock}\n\n${after}`.trim();
  }

  return `${cleaned}\n\n${pricingBlock}`.trim();
}

/** Merge saved quote pricing into a generated proposal (post-Grok). */
export function applyEngagementPricingToProposal(
  proposal: GeneratedProposal,
  quote: EngagementQuoteStored,
): GeneratedProposal {
  const pricingBlock = buildPricingSummaryBlock(quote);
  const pitchSection = insertPricingBlock(proposal.pitchSection, pricingBlock);
  const fullProposal = `${proposal.defineSection}\n\n${pitchSection}`.trim();

  return {
    defineSection: proposal.defineSection,
    pitchSection,
    fullProposal,
  };
}

/** Merge saved quote pricing into full proposal text (pre-send safety net). */
export function applyEngagementPricingToFullText(
  proposalText: string,
  quote: EngagementQuoteStored,
): string {
  const pricingBlock = buildPricingSummaryBlock(quote);
  const pitchIdx = proposalText.search(/(?:RECOMMENDED APPROACH|CLIENT PITCH)\s*[—–-]/i);
  const defineIdx = proposalText.search(/DEFINE\s*[—–-]/i);

  if (defineIdx >= 0 && pitchIdx > defineIdx) {
    const defineSection = proposalText.slice(0, pitchIdx).trim();
    const pitchSection = insertPricingBlock(proposalText.slice(pitchIdx).trim(), pricingBlock);
    return `${defineSection}\n\n${pitchSection}`.trim();
  }

  if (INVESTMENT_HEADER.test(proposalText)) {
    return insertPricingBlock(proposalText, pricingBlock);
  }

  return insertPricingBlock(proposalText, pricingBlock);
}

export function buildPricingPromptContext(quote: EngagementQuoteStored): string {
  const { activationFee, totalFee, balanceDue } = effectiveQuoteFees(quote);
  return [
    '--- APPROVED ENGAGEMENT ECONOMICS (internal reference — do NOT paste these lines into the proposal) ---',
    `Tier: ${quote.tierLabel} | EAI: ${quote.eaiScore}`,
    `Total: ${formatUsd(totalFee)} | Activation: ${formatUsd(activationFee)} | Balance: ${formatUsd(balanceDue)}`,
    'Write about the Engagement Activation Retainer qualitatively only. Exact fee lines are inserted automatically after generation.',
  ].join('\n');
}
