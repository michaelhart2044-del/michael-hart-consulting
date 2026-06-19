'use client';

import { useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';
import {
  labelForEntityCount,
  labelForFinanceTeamSize,
  labelForRevenueBand,
} from '@/lib/intake-options';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';

type DossierSubmission = PrepSubmission & { proposalDraft?: string };

type StepStatus = 'complete' | 'pending' | 'empty';

interface Props {
  submission: DossierSubmission;
  consult30Transcript: string;
  onConsult30TranscriptChange: (value: string) => void;
  consult60Transcript: string;
  onConsult60TranscriptChange: (value: string) => void;
  onSaveTranscripts: () => void | Promise<void>;
}

function formatTimestamp(iso?: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString();
}

function formatBundleTimestamp(iso?: string): string {
  if (!iso) return 'PENDING';
  return new Date(iso).toLocaleString();
}

function pendingOrText(value?: string | null, pendingLabel = 'PENDING — not yet captured'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : pendingLabel;
}

function formatPortalPrep(discovery?: PrepSubmission['preMeetingDiscovery']): string {
  if (!discovery || Object.keys(discovery).length === 0) {
    return 'PENDING — client has not completed portal prep questions';
  }
  return Object.entries(discovery)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

function buildDmaicBundle(
  submission: DossierSubmission,
  consult30Transcript: string,
  consult60Transcript: string,
): string {
  const additionalChallenges =
    submission.additionalChallenges?.length > 0
      ? submission.additionalChallenges.map((c) => `- ${c}`).join('\n')
      : 'None listed';

  const proposalBody = pendingOrText(
    submission.proposalDraft,
    'PENDING — no proposal draft saved in admin',
  );

  const lines = [
    '=== MH CONSULTING — ENGAGEMENT BUNDLE v1 ===',
    '',
    `Client: ${submission.name} <${submission.email}>`,
    `Dossier ID: ${submission.id}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '--- PHASE 1: INITIAL INTAKE ---',
    `Submitted: ${formatBundleTimestamp(submission.createdAt)}`,
    `Industry / Business Type: ${submission.industry}`,
    `Approximate annual revenue: ${labelForRevenueBand(submission.revenueBand)}`,
    `Legal entities: ${labelForEntityCount(submission.entityCount)}`,
    `Finance team: ${labelForFinanceTeamSize(submission.financeTeamSize) || submission.peopleInvolved || 'Not provided'}`,
    `Main Challenge: ${submission.mainChallenge}`,
    `Additional Challenges:\n${additionalChallenges}`,
    `People involved in month-end / reporting: ${submission.peopleInvolved}`,
    `What success looks like (30–90 days): ${submission.successLooksLike}`,
    `Additional context / deadlines: ${submission.additionalContext || 'None provided'}`,
    '',
    '--- PHASE 2: 30-MIN CONSULT ---',
    `Booked: ${formatBundleTimestamp(submission.calendlyBookedAt)}`,
    'Transcript:',
    pendingOrText(consult30Transcript, 'PENDING — paste 30-min Teams transcript in evidence timeline'),
    '',
    '--- ENGAGEMENT ECONOMICS (EAI) ---',
    submission.engagementQuote
      ? (() => {
          const f = effectiveQuoteFees(submission.engagementQuote!);
          return [
            `EAI Score: ${submission.engagementQuote!.eaiScore} (${submission.engagementQuote!.tierLabel})`,
            `Activation: ${formatUsd(f.activationFee)} | Total Phase 1: ${formatUsd(f.totalFee)} | Balance: ${formatUsd(f.balanceDue)}`,
            submission.engagementQuote!.notes ? `Notes: ${submission.engagementQuote!.notes}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        })()
      : 'PENDING — compute and save quote in Engagement Economics panel',
    '',
    '--- PHASE 3: PROPOSAL ---',
    `Proposal sent: ${formatBundleTimestamp(submission.sentAt)}`,
    `Accepted (Step 8 — agreement + payment): ${formatBundleTimestamp(submission.engagementCommittedAt)}`,
    'Proposal text:',
    proposalBody,
    '',
    '--- PHASE 4: PORTAL PREP + 1-HR BOOKING ---',
    'Portal prep answers:',
    formatPortalPrep(submission.preMeetingDiscovery),
    `1-hr comprehensive meeting booked: ${formatBundleTimestamp(submission.comprehensiveBookedAt)}`,
    '',
    '--- PHASE 5: 60-MIN DEEP DIVE ---',
    'Transcript:',
    pendingOrText(consult60Transcript, 'PENDING — paste 60-min Teams transcript in evidence timeline'),
    '',
    '=== END BUNDLE — paste into SigVai DMAIC ===',
  ];

  return lines.join('\n');
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'complete') {
    return (
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-900/50 text-sm text-emerald-300">
        ✅
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex h-6 min-w-[4.5rem] shrink-0 items-center justify-center rounded-full bg-amber-900/40 px-2 text-[10px] font-medium uppercase tracking-wide text-amber-200">
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-sm text-[#64748b]">
      ○
    </span>
  );
}

function SubStep({
  label,
  status,
  timestamp,
  detail,
}: {
  label: string;
  status: StepStatus;
  timestamp?: string | null;
  detail?: string;
}) {
  return (
    <div className="flex gap-3 py-2">
      <StatusIcon status={status} />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-[#e2e8f0]">{label}</div>
        {timestamp && <div className="text-xs text-[#64748b] mt-0.5">{timestamp}</div>}
        {detail && <div className="text-xs text-[#94a3b8] mt-0.5">{detail}</div>}
      </div>
    </div>
  );
}

function getMissingForFullBundle({
  hasIntake,
  has30Booked,
  has30Transcript,
  hasProposalDraft,
  hasProposalSent,
  hasAccepted,
  hasPortalPrep,
  has60Booked,
  has60Transcript,
  portalAccessGranted,
}: {
  hasIntake: boolean;
  has30Booked: boolean;
  has30Transcript: boolean;
  hasProposalDraft: boolean;
  hasProposalSent: boolean;
  hasAccepted: boolean;
  hasPortalPrep: boolean;
  has60Booked: boolean;
  has60Transcript: boolean;
  portalAccessGranted: boolean;
}): string[] {
  const missing: string[] = [];

  if (!hasIntake) missing.push('Initial intake form not submitted');
  if (!has30Booked) missing.push('30-minute consult booking not recorded');
  if (!has30Transcript) missing.push('30-minute Teams transcript not pasted');
  if (!hasProposalDraft && !hasProposalSent) missing.push('Proposal not generated or saved');
  else if (!hasProposalSent) missing.push('Proposal not marked as sent');
  if (!hasAccepted) missing.push('Step 8 — agreement and payment not recorded');
  if (!hasPortalPrep) {
    missing.push(
      portalAccessGranted
        ? 'Portal prep questions not completed by client'
        : 'Portal prep not started (invite client first)',
    );
  }
  if (!has60Booked) missing.push('1-hour comprehensive meeting not booked');
  if (!has60Transcript) missing.push('60-minute deep-dive transcript not pasted');

  return missing;
}

function LayerCard({
  layer,
  title,
  summary,
  status,
  children,
}: {
  layer: number;
  title: string;
  summary: StepStatus;
  status?: string;
  children: React.ReactNode;
}) {
  const borderTone =
    summary === 'complete'
      ? 'border-emerald-500/30'
      : summary === 'pending'
        ? 'border-amber-500/30'
        : 'border-white/10';

  return (
    <div className={`rounded-xl border ${borderTone} bg-[#111827]/60 p-4`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Layer {layer}</div>
          <h3 className="font-semibold text-[#f1f5f9] mt-0.5">{title}</h3>
        </div>
        <StatusIcon status={summary} />
      </div>
      {status && <p className="text-xs text-[#64748b] mb-3">{status}</p>}
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

export default function ClientEvidenceTimeline({
  submission,
  consult30Transcript,
  onConsult30TranscriptChange,
  consult60Transcript,
  onConsult60TranscriptChange,
  onSaveTranscripts,
}: Props) {
  const [copied, setCopied] = useState(false);

  const hasIntake = !!submission.createdAt;
  const has30Booked = !!submission.calendlyBookedAt;
  const has30Transcript = consult30Transcript.trim().length > 20;
  const hasProposalSent = !!submission.sentAt;
  const hasProposalDraft = !!(submission.proposalDraft && submission.proposalDraft.trim().length > 20);
  const hasAccepted = !!submission.engagementCommittedAt;
  const hasPortalPrep = !!submission.preMeetingDiscovery && Object.keys(submission.preMeetingDiscovery).length > 0;
  const has60Booked = !!submission.comprehensiveBookedAt;
  const has60Transcript = consult60Transcript.trim().length > 20;

  const layer1Status: StepStatus = hasIntake ? 'complete' : 'empty';

  const layer2Status: StepStatus =
    has30Booked && has30Transcript ? 'complete' : has30Booked || has30Transcript ? 'pending' : 'empty';

  const layer3Status: StepStatus =
    hasAccepted && (hasProposalSent || hasProposalDraft)
      ? 'complete'
      : hasProposalSent || hasProposalDraft || hasAccepted
        ? 'pending'
        : 'empty';

  const layer4Status: StepStatus =
    hasPortalPrep && has60Booked
      ? 'complete'
      : hasPortalPrep || has60Booked || !!submission.portalAccessGrantedAt
        ? 'pending'
        : 'empty';

  const layer5Status: StepStatus = has60Transcript ? 'complete' : has60Booked || hasPortalPrep ? 'pending' : 'empty';

  const completedLayers = [layer1Status, layer2Status, layer3Status, layer4Status, layer5Status].filter(
    (s) => s === 'complete',
  ).length;

  const missingItems = getMissingForFullBundle({
    hasIntake,
    has30Booked,
    has30Transcript,
    hasProposalDraft,
    hasProposalSent,
    hasAccepted,
    hasPortalPrep,
    has60Booked,
    has60Transcript,
    portalAccessGranted: !!submission.portalAccessGrantedAt,
  });

  const readyForBundle = missingItems.length === 0;

  async function handleGenerateBundle() {
    await onSaveTranscripts();
    const bundle = buildDmaicBundle(submission, consult30Transcript, consult60Transcript);
    const date = new Date().toISOString().slice(0, 10);
    const safeName = (submission.name || 'Client').replace(/\s+/g, '-');
    const filename = `MH-Bundle-${safeName}-${date}.txt`;

    const blob = new Blob([bundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    try {
      await navigator.clipboard.writeText(bundle);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="border border-[#c5a46e]/35 rounded-2xl bg-[#0f172a] p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg text-[#c5a46e]">Client Evidence Timeline</h2>
          <p className="text-sm text-[#94a3b8] mt-1 max-w-prose">
            Five evidence layers for this engagement — intake through deep-dive. Paste Teams transcripts as they
            become available.
          </p>
        </div>
        <div className="text-xs text-[#64748b] shrink-0 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <span className="text-[#c5a46e] font-medium">{completedLayers}</span> of 5 layers complete
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 rounded-lg border border-amber-500/25 bg-amber-950/20 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">
            What&apos;s Missing for Full Bundle?
          </div>
          {readyForBundle ? (
            <p className="text-sm text-emerald-300 mt-2">All captured evidence is ready for the full DMAIC bundle.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-[#cbd5e1] list-disc list-inside">
              {missingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="text-sm rounded-lg border border-white/10 bg-black/20 px-4 py-3">
        <span className="text-[#94a3b8]">Client:</span>{' '}
        <span className="text-[#f1f5f9] font-medium">{submission.name}</span>
        <span className="text-[#64748b] ml-2">({submission.email})</span>
      </div>

      <div className="space-y-4">
        <LayerCard
          layer={1}
          title="Initial Intake"
          summary={layer1Status}
          status={hasIntake ? 'Captured from /prepare-analysis' : undefined}
        >
          <SubStep
            label="Prep form submitted"
            status={hasIntake ? 'complete' : 'empty'}
            timestamp={formatTimestamp(submission.createdAt)}
            detail={
              hasIntake
                ? `${submission.industry} — ${submission.mainChallenge.slice(0, 60)}${submission.mainChallenge.length > 60 ? '…' : ''}`
                : undefined
            }
          />
          {hasIntake && (submission.revenueBand || submission.entityCount || submission.financeTeamSize) && (
            <SubStep
              label="Organization snapshot"
              status="complete"
              detail={`${labelForRevenueBand(submission.revenueBand)} · ${labelForEntityCount(submission.entityCount)} · ${labelForFinanceTeamSize(submission.financeTeamSize) || submission.peopleInvolved}`}
            />
          )}
        </LayerCard>

        <LayerCard
          layer={2}
          title="30-Minute Consultation"
          summary={layer2Status}
          status="Teams meeting + transcript"
        >
          <SubStep
            label="30-min Calendly booked"
            status={has30Booked ? 'complete' : submission.calendly30CanceledAt ? 'pending' : 'empty'}
            timestamp={formatTimestamp(submission.calendlyBookedAt)}
            detail={
              !has30Booked && submission.calendly30CanceledAt
                ? `Canceled ${formatTimestamp(submission.calendly30CanceledAt)}`
                : undefined
            }
          />
          <div className="pt-3 pb-1">
            <div className="flex items-center gap-3 mb-2">
              <StatusIcon status={has30Transcript ? 'complete' : has30Booked ? 'pending' : 'empty'} />
              <label htmlFor="consult30-transcript" className="text-sm text-[#e2e8f0]">
                30-min Teams transcript / notes
              </label>
            </div>
            <textarea
              id="consult30-transcript"
              rows={4}
              value={consult30Transcript}
              onChange={(e) => onConsult30TranscriptChange(e.target.value)}
              onBlur={() => void onSaveTranscripts()}
              placeholder="Paste the 30-minute Teams transcript or call notes here…"
              className="w-full bg-[#0a0f2c] border border-white/15 rounded-lg px-3 py-2.5 text-sm font-mono text-[#cbd5e1] placeholder:text-[#475569] focus:outline-none focus:border-[#c5a46e]/60 leading-relaxed"
            />
            <p className="text-[10px] text-[#64748b] mt-1.5">Saves automatically when you click away from this field.</p>
          </div>
        </LayerCard>

        <LayerCard
          layer={3}
          title="Proposal & Client Acceptance"
          summary={layer3Status}
          status="Pitch sent and agreement / payment"
        >
          <SubStep
            label="Proposal generated / draft saved"
            status={hasProposalDraft ? 'complete' : hasProposalSent ? 'pending' : 'empty'}
            detail={hasProposalDraft ? 'Draft on file in admin' : 'Generate and Save Draft in proposal tool below'}
          />
          <SubStep
            label="Proposal marked sent"
            status={hasProposalSent ? 'complete' : 'empty'}
            timestamp={formatTimestamp(submission.sentAt)}
          />
          <SubStep
            label="Agreement signed & payment received (Step 8)"
            status={hasAccepted ? 'complete' : 'empty'}
            timestamp={formatTimestamp(submission.engagementCommittedAt)}
          />
        </LayerCard>

        <LayerCard
          layer={4}
          title="Portal Prep & 1-Hour Booking"
          summary={layer4Status}
          status="Quick portal questions + comprehensive meeting"
        >
          <SubStep
            label="Portal prep questions answered"
            status={hasPortalPrep ? 'complete' : submission.portalAccessGrantedAt ? 'pending' : 'empty'}
            detail={
              hasPortalPrep
                ? `${Object.keys(submission.preMeetingDiscovery!).filter((k) => k !== 'additionalNotes').length} answers saved`
                : submission.portalAccessGrantedAt
                  ? 'Awaiting client in portal'
                  : undefined
            }
          />
          <SubStep
            label="1-hour comprehensive meeting booked"
            status={has60Booked ? 'complete' : submission.comprehensiveCanceledAt ? 'pending' : 'empty'}
            timestamp={formatTimestamp(submission.comprehensiveBookedAt)}
            detail={
              !has60Booked && submission.comprehensiveCanceledAt
                ? `Canceled ${formatTimestamp(submission.comprehensiveCanceledAt)}`
                : !has60Booked && submission.portalAccessGrantedAt
                  ? 'Book via portal Calendly — updates automatically via webhook'
                  : !has60Booked
                    ? 'Grant portal access first'
                    : undefined
            }
          />
        </LayerCard>

        <LayerCard
          layer={5}
          title="60-Minute Deep Dive"
          summary={layer5Status}
          status="Full team session transcript"
        >
          <div className="pt-1 pb-1">
            <div className="flex items-center gap-3 mb-2">
              <StatusIcon status={has60Transcript ? 'complete' : hasPortalPrep ? 'pending' : 'empty'} />
              <label htmlFor="consult60-transcript" className="text-sm text-[#e2e8f0]">
                60-min Teams transcript / notes
              </label>
            </div>
            <textarea
              id="consult60-transcript"
              rows={4}
              value={consult60Transcript}
              onChange={(e) => onConsult60TranscriptChange(e.target.value)}
              onBlur={() => void onSaveTranscripts()}
              placeholder="Paste the 1-hour Teams transcript or meeting notes here…"
              className="w-full bg-[#0a0f2c] border border-white/15 rounded-lg px-3 py-2.5 text-sm font-mono text-[#cbd5e1] placeholder:text-[#475569] focus:outline-none focus:border-[#c5a46e]/60 leading-relaxed"
            />
            <p className="text-[10px] text-[#64748b] mt-1.5">Saves automatically when you click away from this field.</p>
          </div>
        </LayerCard>
      </div>

      <div className="pt-4 border-t border-[#c5a46e]/25 space-y-2">
        <p className="text-xs text-[#64748b] text-center max-w-prose mx-auto">
          <span className="text-[#94a3b8] font-medium">Later in the engagement</span> — after Layers 4–5 (portal prep + 60-min deep dive).
          Not part of the initial 30-min proposal flow.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void handleGenerateBundle()}
          className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium rounded-full border border-[#c5a46e]/40 text-[#c5a46e] hover:bg-[#c5a46e]/10 transition-all"
        >
          Generate DMAIC Bundle for SigVai
        </button>
        {copied && (
          <span className="text-sm font-medium text-emerald-300 animate-pulse">Copied!</span>
        )}
        </div>
      </div>
    </section>
  );
}