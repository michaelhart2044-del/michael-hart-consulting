/**
 * Post–30-min consult proposal generation via xAI (Grok).
 * Server-only. Requires XAI_API_KEY in environment.
 */

import {
  PROPOSAL_APPROACH_HEADER,
  type GeneratedProposal,
  type GeneratorInput,
} from '@/lib/proposal-generator';
import { buildEngagementScopeHint } from '@/lib/proposal-pricing';
import { PORTAL_ACCESS_SLA } from '@/lib/portal-client-copy';

const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';

const DEFAULT_MODEL = 'grok-4-1-fast-non-reasoning';

function resolveModel(): string {
  return process.env.XAI_PROPOSAL_MODEL?.trim() || DEFAULT_MODEL;
}

function buildSystemPrompt(): string {
  return `You are the proposal writer for Michael Hart Consulting Group LLC — premium forensic accounting, month-end close, SOX/controls, M&A advisory, and AI automation for finance teams.

Write client-facing initial proposals after the 30-minute discovery call. Tone: confident, precise, benefit-focused, no hype. Voice: Michael Hart — trusted advisor, not a sales bot.

Structure your response EXACTLY with these two section headers on their own lines:

DEFINE — Current State & Opportunity for [Client Name]

${PROPOSAL_APPROACH_HEADER}

DEFINE must cover: industry context, challenges from intake + call, team/effort, desired outcomes, constraints, and key insights from the consult transcript.

RECOMMENDED APPROACH must include:
- Why this matters (quantified impacts where possible from the conversation)
- Estimated ROI framing (conservative, illustrative — invite refinement with their data)
- Recommended starting point: "Engagement Activation Retainer" (4–6 weeks): discovery, quick wins, 30–90 day roadmap, controls health check, 1–2 delivered improvements, executive summary
- Clear next steps (artifacts to share, kickoff timing, and that within ${PORTAL_ACCESS_SLA} of agreement and activation payment they receive private client portal access for brief prep questions and to schedule the 1-hour team meeting)
- Sign off: Michael Hart (no em dash or prefix)

Pricing rules (initial proposal stage):
- Do NOT include dollar amounts for our fees, activation retainers, total project fees, or balance due.
- Do NOT include an INVESTMENT section or fee schedule — pricing is shared separately after the client reviews this document.
- You may reference the client's own revenue or scale from the transcript when describing their situation (e.g. "$45M operator").
- Describe the Engagement Activation Retainer (4–6 weeks) in terms of deliverables and outcomes only.

Rules:
- Use ONLY facts from the provided intake and transcript. Do not invent client metrics.
- If the transcript lacks numbers, use ranges and label them as illustrative.
- No markdown headers except the two section titles above. Use plain text with bullet dashes.
- Do not include internal operator notes (e.g. "Source:", SigVai references, or separator lines).
- Keep total length 900–1400 words unless the case is unusually complex.`;
}

function buildUserPrompt(input: GeneratorInput): string {
  const challenges = [input.mainChallenge, ...(input.additionalChallenges || [])]
    .filter(Boolean)
    .map((c) => `- ${c}`)
    .join('\n');

  const parts = [
    `Client name: ${input.name}`,
    `Industry: ${input.industry || 'Not specified'}`,
    `Main and additional challenges:\n${challenges || '- See transcript'}`,
    `People involved in month-end / reporting: ${input.peopleInvolved || 'Not specified'}`,
    `Success in 30–90 days: ${input.successLooksLike || 'Not specified'}`,
    `Additional context / deadlines: ${input.additionalContext || 'None'}`,
    '',
    '--- 30-MINUTE CONSULT TRANSCRIPT / NOTES (primary source for proposal) ---',
    input.consult30Transcript?.trim() || '(missing)',
  ];

  if (input.engagementQuote) {
    parts.push('', buildEngagementScopeHint(input.engagementQuote));
  }

  if (input.transcript?.trim()) {
    parts.push('', '--- SUPPLEMENTAL NOTES ---', input.transcript.trim());
  }

  return parts.join('\n');
}

function splitSections(raw: string): GeneratedProposal {
  const text = raw.trim();
  const pitchIdx = text.search(/(?:CLIENT PITCH|RECOMMENDED APPROACH)\s*[—–-]/i);
  const defineIdx = text.search(/DEFINE\s*[—–-]/i);

  if (defineIdx >= 0 && pitchIdx > defineIdx) {
    const defineSection = text.slice(defineIdx, pitchIdx).trim();
    const pitchSection = text.slice(pitchIdx).trim();
    return {
      defineSection,
      pitchSection,
      fullProposal: `${defineSection}\n\n${pitchSection}`,
    };
  }

  return {
    defineSection: text,
    pitchSection: '',
    fullProposal: text,
  };
}

export function isXaiProposalConfigured(): boolean {
  return !!process.env.XAI_API_KEY?.trim();
}

export async function generateProposalWithXai(input: GeneratorInput): Promise<GeneratedProposal> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('XAI_API_KEY is not configured');
  }

  const res = await fetch(XAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: resolveModel(),
      temperature: 0.35,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    }),
  });

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    const msg = body.error?.message || `xAI API error (${res.status})`;
    throw new Error(msg);
  }

  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('xAI returned an empty proposal');
  }

  return splitSections(content);
}
