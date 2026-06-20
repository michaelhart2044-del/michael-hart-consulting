/**
 * Client-facing proposal text — strip fees at initial proposal stage.
 * Engagement economics stay in admin (EAI panel) until PandaDoc retainer (Phase 2C Step 1 in admin).
 */

import type { GeneratedProposal } from '@/lib/proposal-generator';
import type { EngagementQuoteStored } from '@/lib/engagement-pricing';

/** Remove investment blocks, fee lines, and Grok-echoed pricing from client delivery. */
export function stripPricingSection(text: string): string {
  let cleaned = text;

  cleaned = cleaned.replace(
    /\n*INVESTMENT\s*[—–-]\s*Engagement Activation Retainer[^\n]*\n[\s\S]*?(?=\n[ \t]*(?:Clear next steps\b|\d+\.\s|I['']m looking forward|Michael Hart\b)|$)/gi,
    '',
  );

  cleaned = cleaned.replace(/\n[ \t]*Fixed fee:\s*\$[\d,]+(?:\.\d+)?\.?\s*/gi, '\n');
  cleaned = cleaned.replace(
    /\n[ \t]*Activation due at signing:\s*\$[\d,]+(?:\.\d+)?[^\n]*\n?/gi,
    '\n',
  );
  cleaned = cleaned.replace(
    /\n[ \t]*Balance due upon delivery[^\n]*:\s*\$[\d,]+(?:\.\d+)?\.?\s*/gi,
    '\n',
  );

  cleaned = cleaned.replace(
    /\s*The activation retainer is structured with \$[\d,]+(?:\.\d+)? due at signing[\s\S]*?\.\s*/gi,
    ' ',
  );

  cleaned = cleaned.replace(
    /\n*This retainer is designed to stand alone or serve as the on-ramp[\s\S]*?confirmed after the initial consultation and data review\.\n?/i,
    '\n',
  );

  cleaned = cleaned.replace(/Clear next steps[\d,]+(?:\.\d+)?\.\s*/gi, 'Clear next steps: ');

  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

/** Initial proposal (Layer 3) — scope and approach only; no fee language. */
export function prepareProposalForClientDelivery(text: string): string {
  return stripPricingSection(text);
}

function stripPricingFromSections(proposal: GeneratedProposal): GeneratedProposal {
  const defineSection = proposal.defineSection.trim();
  const pitchSection = stripPricingSection(proposal.pitchSection);
  return {
    defineSection,
    pitchSection,
    fullProposal: `${defineSection}\n\n${pitchSection}`.trim(),
  };
}

/** Post-Grok: remove any fee language; do not inject pricing at initial proposal stage. */
export function finalizeInitialProposal(proposal: GeneratedProposal): GeneratedProposal {
  return stripPricingFromSections(proposal);
}

/** Pre-send / PDF safety net. */
export function finalizeProposalText(proposalText: string): string {
  return prepareProposalForClientDelivery(proposalText);
}

/** Internal Grok context — tier/scope hint only; never paste fees into the proposal. */
export function buildEngagementScopeHint(quote: EngagementQuoteStored): string {
  return [
    '--- INTERNAL ENGAGEMENT SCOPE (do not include fees or INVESTMENT section in the proposal) ---',
    `Complexity tier: ${quote.tierLabel} (EAI ${quote.eaiScore}).`,
    'Describe the Engagement Activation Retainer (4–6 weeks) and deliverables only.',
    'Do NOT mention dollar amounts, activation fees, total fees, balance due, or an INVESTMENT section.',
    'Pricing is shared separately after the client reviews this initial proposal.',
  ].join('\n');
}
