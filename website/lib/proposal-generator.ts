/**
 * Internal-only proposal generator.
 * Takes structured prep data (from the public intake form) + optional free-text transcript/notes
 * and produces a clean, client-ready "DEFINE" + "RECOMMENDED APPROACH" document.
 *
 * This runs entirely server-side in the private /admin tool.
 * The output is designed to be fed directly into SigVai / xAI or lightly edited by Michael.
 *
 * No external calls. 100% private.
 */

export interface GeneratorInput {
  name: string;
  industry: string;
  mainChallenge: string;
  additionalChallenges: string[];
  peopleInvolved: string;
  successLooksLike: string;
  additionalContext: string;
  /** 30-min consult transcript from Evidence Timeline (required for xAI generation). */
  consult30Transcript?: string;
  /** Optional supplemental notes beyond the consult transcript. */
  transcript?: string;
}

/** Client-facing second section header (replaces legacy "CLIENT PITCH" label). */
export const PROPOSAL_APPROACH_HEADER = 'RECOMMENDED APPROACH — Path Forward & Next Steps';

export interface GeneratedProposal {
  defineSection: string;
  pitchSection: string;
  fullProposal: string;
}

function clean(text: string): string {
  return (text || '').trim().replace(/\s+/g, ' ');
}

function bulletList(items: string[]): string {
  return items.filter(Boolean).map((i) => `- ${clean(i)}`).join('\n');
}

export function generateProposal(input: GeneratorInput): GeneratedProposal {
  const {
    name,
    industry,
    mainChallenge,
    additionalChallenges = [],
    peopleInvolved,
    successLooksLike,
    additionalContext,
    transcript = '',
  } = input;

  const allChallenges = [mainChallenge, ...additionalChallenges].filter(Boolean);

  // === DEFINE SECTION (fact-based, discovery style) ===
  let define = `DEFINE — Current State & Opportunity for ${name || 'the Client'}\n\n`;
  define += `Industry / Business Type: ${industry || 'Not specified'}\n\n`;

  define += `Key Challenges Identified:\n`;
  if (allChallenges.length > 0) {
    define += bulletList(allChallenges) + '\n';
  } else {
    define += '- (Challenges captured during intake)\n';
  }

  if (peopleInvolved) {
    define += `\nTeam & Effort: ${clean(peopleInvolved)} currently involved in month-end / reporting processes.\n`;
  }

  if (successLooksLike) {
    define += `\nDesired Outcomes (30–90 days): ${clean(successLooksLike)}\n`;
  }

  if (additionalContext) {
    define += `\nCritical Context & Constraints: ${clean(additionalContext)}\n`;
  }

  if (transcript && transcript.trim().length > 30) {
    define += `\nAdditional Insights from Discussion / Notes:\n${clean(transcript).slice(0, 1200)}\n`;
  }

  define += `\n`;

  // === RECOMMENDED APPROACH (benefits, ROI, package, next steps) ===
  let pitch = `${PROPOSAL_APPROACH_HEADER}\n\n`;

  // Benefits tailored to the actual challenges mentioned
  pitch += `Why This Matters for ${name || 'Your Organization'}\n`;
  pitch += `The current state creates measurable drag on finance operations, leadership visibility, and team capacity. Common impacts we see (and will quantify together) include:\n\n`;

  const benefitBullets: string[] = [];

  const challengeText = allChallenges.join(' ').toLowerCase();

  if (challengeText.includes('month-end') || challengeText.includes('close')) {
    benefitBullets.push('Reduce month-end close cycle time by 40–70% (typical move from 10–20+ days down to reliable 5–8 business days).');
  }
  if (challengeText.includes('reconciliations') || challengeText.includes('balance sheet')) {
    benefitBullets.push('Cut reconciliation effort from hours/days to minutes with automated, auditable workflows and variance flagging.');
  }
  if (challengeText.includes('manual') || challengeText.includes('spreadsheet')) {
    benefitBullets.push('Replace high-risk manual spreadsheets and repetitive work with controlled, repeatable processes (often 15–30+ hours/month recovered).');
  }
  if (challengeText.includes('controls') || challengeText.includes('audit') || challengeText.includes('sox')) {
    benefitBullets.push('Strengthen controls and audit readiness — fewer PBC requests, cleaner supporting schedules, reduced external audit friction.');
  }
  if (challengeText.includes('data') || challengeText.includes('visibility') || challengeText.includes('stakeholder')) {
    benefitBullets.push('Deliver reliable, timely financial data to CFO, PE sponsors, board, and operators — improving decision quality and trust.');
  }
  if (challengeText.includes('staffing') || challengeText.includes('capacity') || challengeText.includes('team')) {
    benefitBullets.push('Free senior team capacity for higher-value work and reduce burnout / key-person risk in the finance function.');
  }

  if (benefitBullets.length === 0) {
    benefitBullets.push('Accelerate financial operations, reduce manual effort, and create a scalable, controlled close and reporting environment.');
  }

  pitch += bulletList(benefitBullets) + '\n\n';

  // Rough ROI framing (conservative, owner can refine with real numbers)
  pitch += `Estimated ROI (illustrative — we will refine with your actual data)\n`;
  pitch += `Even modest time savings compound quickly. Example: recovering 20 hours per month at a fully-loaded finance cost of $120–180/hour delivers $24k–$36k annual capacity. Add faster close (better decisions, lower audit fees, reduced risk) and the payback is typically measured in weeks, not months.\n\n`;

  // The specific package the user requested
  pitch += `Recommended Starting Point: Engagement Activation Retainer\n`;
  pitch += `A focused 4–6 week activation that gives you immediate clarity and quick wins while building the foundation for longer-term transformation:\n\n`;
  pitch += `- Deep-dive discovery & process mapping (current state, bottlenecks, system landscape)\n`;
  pitch += `- Identification of highest-ROI quick wins (automation, controls, reporting improvements)\n`;
  pitch += `- 30–90 day prioritized roadmap with effort/impact estimates and sequencing\n`;
  pitch += `- Initial controls & compliance health check (SOX/audit readiness where relevant)\n`;
  pitch += `- Hands-on support delivering 1–2 tangible improvements during the activation window\n`;
  pitch += `- Executive summary + working materials ready for leadership or PE review\n\n`;
  pitch += `This retainer is designed to stand alone or serve as the on-ramp to a broader ongoing advisory relationship. Investment and exact scope are confirmed after the initial consultation and data review.\n\n`;

  // Clear next steps
  pitch += `Clear Next Steps\n`;
  pitch += `1. Complete the 30-minute initial consultation (already scheduled).\n`;
  pitch += `2. Share a small set of sample artifacts (recent close package, org chart for finance team, high-level system list, or any current pain examples).\n`;
  pitch += `3. We schedule a short kickoff (within 5 business days of the call) and begin the Activation Retainer.\n`;
  pitch += `4. You receive the DEFINE + roadmap + first delivered improvements within the agreed window.\n\n`;

  pitch += `I’m looking forward to helping you turn these challenges into a faster, cleaner, more strategic finance operation.\n\n`;
  pitch += `Michael Hart\n`;

  const fullProposal = `${define}\n\n${pitch}`;

  return {
    defineSection: define.trim(),
    pitchSection: pitch.trim(),
    fullProposal: fullProposal.trim(),
  };
}
