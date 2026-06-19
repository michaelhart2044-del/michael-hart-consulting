'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';
import {
  computeEngagementQuote,
  effectiveQuoteFees,
  formatUsd,
  buildPricingSummaryBlock,
  type EngagementQuoteStored,
} from '@/lib/engagement-pricing';
import {
  labelForEntityCount,
  labelForFinanceTeamSize,
  labelForRevenueBand,
} from '@/lib/intake-options';
import { saveEngagementQuoteForAdmin } from '@/app/actions';

interface Props {
  submission: PrepSubmission;
  consult30Transcript: string;
  onSaved: (submission: PrepSubmission) => void;
  onStatus: (message: string, isError?: boolean) => void;
}

export default function EngagementEconomicsPanel({
  submission,
  consult30Transcript,
  onSaved,
  onStatus,
}: Props) {
  const computed = useMemo(
    () =>
      computeEngagementQuote({
        industry: submission.industry,
        revenueBand: submission.revenueBand,
        entityCount: submission.entityCount,
        financeTeamSize: submission.financeTeamSize,
        peopleInvolved: submission.peopleInvolved,
        mainChallenge: submission.mainChallenge,
        additionalChallenges: submission.additionalChallenges,
        successLooksLike: submission.successLooksLike,
        additionalContext: submission.additionalContext,
        consult30Transcript: consult30Transcript || submission.consult30Transcript,
      }),
    [submission, consult30Transcript],
  );

  const [activationOverride, setActivationOverride] = useState('');
  const [totalOverride, setTotalOverride] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = submission.engagementQuote;
    setActivationOverride(
      saved?.activationFeeOverride != null ? String(saved.activationFeeOverride) : '',
    );
    setTotalOverride(saved?.totalFeeOverride != null ? String(saved.totalFeeOverride) : '');
    setNotes(saved?.notes ?? '');
  }, [submission.id, submission.engagementQuote]);

  const draftQuote: EngagementQuoteStored = useMemo(() => {
    const activationFeeOverride = activationOverride.trim()
      ? Number.parseInt(activationOverride.replace(/\D/g, ''), 10)
      : undefined;
    const totalFeeOverride = totalOverride.trim()
      ? Number.parseInt(totalOverride.replace(/\D/g, ''), 10)
      : undefined;
    return {
      ...computed,
      activationFeeOverride: Number.isFinite(activationFeeOverride) ? activationFeeOverride : undefined,
      totalFeeOverride: Number.isFinite(totalFeeOverride) ? totalFeeOverride : undefined,
      notes: notes.trim() || undefined,
    };
  }, [computed, activationOverride, totalOverride, notes]);

  const fees = effectiveQuoteFees(draftQuote);

  const confidenceLabel =
    computed.confidence === 'high'
      ? 'High — intake + consult'
      : computed.confidence === 'medium'
        ? 'Medium — some gaps'
        : 'Low — add transcript or revenue';

  async function handleSave() {
    if (fees.activationFee >= fees.totalFee) {
      onStatus('Activation fee must be less than total project fee.', true);
      return;
    }
    setSaving(true);
    const res = await saveEngagementQuoteForAdmin(submission.id, draftQuote);
    setSaving(false);
    if (res.success && res.submission) {
      onSaved(res.submission);
      onStatus('Engagement quote saved on client record.');
    } else {
      onStatus(res.error || 'Failed to save quote.', true);
    }
  }

  async function copyPricingBlock() {
    const text = buildPricingSummaryBlock(draftQuote);
    try {
      await navigator.clipboard.writeText(text);
      onStatus('Pricing block copied — paste into proposal if needed.');
    } catch {
      onStatus('Copy failed — select text manually.', true);
    }
  }

  return (
    <section className="border border-[#c5a46e]/35 rounded-2xl bg-[#0a0f2c]/80 p-6 space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Engagement Economics</div>
        <h2 className="font-semibold text-lg mt-0.5">Engagement Activation Index</h2>
        <p className="text-sm text-[#94a3b8] mt-1">
          Auto-scored from Step 1 intake and Layer 2 transcript. Internal pricing — not included in the initial client proposal.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">EAI Score</div>
          <div className="text-2xl font-semibold text-[#f1f5f9] mt-1">{computed.eaiScore}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Tier</div>
          <div className="text-lg font-semibold text-[#c5a46e] mt-1">{computed.tierLabel}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Confidence</div>
          <div className="text-sm font-medium text-[#e2e8f0] mt-1.5">{confidenceLabel}</div>
        </div>
        <div className="rounded-xl border border-[#c5a46e]/30 bg-[#c5a46e]/5 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Recommended</div>
          <div className="text-sm text-[#f1f5f9] mt-1.5 leading-snug">
            {formatUsd(fees.activationFee)} activation → {formatUsd(fees.totalFee)} total
          </div>
        </div>
      </div>

      <div className="text-xs text-[#94a3b8] rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
        <span className="text-[#64748b]">Org snapshot:</span>{' '}
        {labelForRevenueBand(submission.revenueBand)} · {labelForEntityCount(submission.entityCount)} ·{' '}
        {labelForFinanceTeamSize(submission.financeTeamSize) || submission.peopleInvolved || 'Team n/a'}
      </div>

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-[#64748b]">Factor breakdown</div>
        <div className="space-y-2">
          {computed.factors.map((f) => {
            const pct = f.maxPoints > 0 ? Math.round((f.points / f.maxPoints) * 100) : 0;
            return (
              <div key={f.id}>
                <div className="flex justify-between text-xs text-[#94a3b8] mb-0.5">
                  <span>{f.label}</span>
                  <span>
                    {f.points}/{f.maxPoints}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#c5a46e]/70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1.5">
            Activation fee override (blank = {formatUsd(computed.activationFee)})
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={activationOverride}
            onChange={(e) => setActivationOverride(e.target.value)}
            placeholder={String(computed.activationFee)}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a46e]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1.5">
            Total Phase 1 override (blank = {formatUsd(computed.totalFee)})
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={totalOverride}
            onChange={(e) => setTotalOverride(e.target.value)}
            placeholder={String(computed.totalFee)}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a46e]"
          />
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#cbd5e1] space-y-1">
        <div>
          <span className="text-[#64748b]">Balance due at delivery:</span> {formatUsd(fees.balanceDue)}
        </div>
        <div>
          <span className="text-[#64748b]">Activation credited:</span> {fees.creditPercent}% of total
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#94a3b8] mb-1.5">Internal notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Founding client rate, PE urgency discount"
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a46e]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="px-5 py-2 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save quote on dossier'}
        </button>
        <button
          type="button"
          onClick={() => void copyPricingBlock()}
          className="px-5 py-2 text-sm rounded-full border border-white/20 hover:bg-white/5"
        >
          Copy pricing block
        </button>
        {submission.engagementQuote?.savedAt && (
          <span className="text-xs text-[#64748b] self-center">
            Saved {new Date(submission.engagementQuote.savedAt).toLocaleString()}
          </span>
        )}
      </div>
    </section>
  );
}
