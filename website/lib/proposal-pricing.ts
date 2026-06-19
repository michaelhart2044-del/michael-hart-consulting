/**
 * Inject saved engagement economics into client-facing proposal text.
 */

import {
  buildPricingSummaryBlock,
  type EngagementQuoteStored,
} from '@/lib/engagement-pricing';
import type { GeneratedProposal } from '@/lib/proposal-generator';

const INVESTMENT_ANCHOR = /INVESTMENT\s*[—–-]\s*Engagement Activation Retainer/i;

/** Remove an existing auto-injected or pasted investment block. */
export function stripPricingSection(text: string): string {
  return text
    .replace(
      /\n*INVESTMENT\s*[—–-]\s*Engagement Activation Retainer[^\n]*\n[\s\S]*?(?=\n\n(?:Clear Next Steps|\d+\.\s|I['']m looking forward|Michael Hart\s*$|$))/i,
      '',
    )
    .replace(
      /\n*This retainer is designed to stand alone or serve as the on-ramp[\s\S]*?confirmed after the initial consultation and data review\.\n?/i,
      '\n',
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function insertPricingBlock(section: string, pricingBlock: string): string {
  const cleaned = stripPricingSection(section);

  const beforeClearNext = /(\n\nClear Next Steps\b)/i;
  if (beforeClearNext.test(cleaned)) {
    return cleaned.replace(beforeClearNext, `\n\n${pricingBlock}$1`);
  }

  const beforeSignoff = /(\n\nI['']m looking forward)/i;
  if (beforeSignoff.test(cleaned)) {
    return cleaned.replace(beforeSignoff, `\n\n${pricingBlock}$1`);
  }

  const beforeMichael = /(\n\nMichael Hart\s*$)/i;
  if (beforeMichael.test(cleaned)) {
    return cleaned.replace(beforeMichael, `\n\n${pricingBlock}$1`);
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

  if (INVESTMENT_ANCHOR.test(proposalText)) {
    return insertPricingBlock(proposalText, pricingBlock);
  }

  return `${stripPricingSection(proposalText)}\n\n${pricingBlock}`.trim();
}

export function buildPricingPromptContext(quote: EngagementQuoteStored): string {
  return [
    '--- APPROVED ENGAGEMENT ECONOMICS (use these exact figures; do not invent other dollar amounts) ---',
    buildPricingSummaryBlock(quote),
    'The system will insert this block verbatim — reference the activation retainer qualitatively only; do not add competing fee lines.',
  ].join('\n');
}
