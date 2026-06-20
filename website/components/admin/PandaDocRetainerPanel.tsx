'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';
import {
  createPandaDocRetainerForAdmin,
  getPandaDocIntegrationStatusForAdmin,
} from '@/app/actions';

interface Props {
  submission: PrepSubmission;
  onUpdated: (submission: PrepSubmission) => void;
  onStatus: (message: string, isError?: boolean) => void;
}

export default function PandaDocRetainerPanel({ submission, onUpdated, onStatus }: Props) {
  const [company, setCompany] = useState(
    () => submission.clientCompany || submission.industry || '',
  );
  const [creating, setCreating] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [missingEnv, setMissingEnv] = useState<string[]>([]);
  const [panelMessage, setPanelMessage] = useState('');
  const [panelIsError, setPanelIsError] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      const res = await getPandaDocIntegrationStatusForAdmin();
      if (res.success) {
        setConfigured(res.configured);
        setMissingEnv(res.configured ? [] : res.missing || []);
      }
    });
  }, []);

  const fees = useMemo(() => {
    if (!submission.engagementQuote) return null;
    return effectiveQuoteFees(submission.engagementQuote);
  }, [submission.engagementQuote]);

  const canCreate =
    configured === true &&
    !!submission.engagementQuote?.savedAt &&
    !!fees &&
    fees.activationFee > 0 &&
    !creating;

  async function handleCreate() {
    if (!canCreate) return;
    setCreating(true);
    setPanelMessage('');
    setPanelIsError(false);

    try {
      const res = await createPandaDocRetainerForAdmin(submission.id, company);
      if (res.success) {
        onUpdated(res.submission);
        setPanelMessage(res.message);
        setPanelIsError(false);
        onStatus(res.message);
      } else {
        const err = res.error || 'PandaDoc request failed.';
        setPanelMessage(err);
        setPanelIsError(true);
        onStatus(err, true);
      }
    } catch {
      const err = 'Request failed — try again. If env vars were just added in Vercel, redeploy first.';
      setPanelMessage(err);
      setPanelIsError(true);
      onStatus(err, true);
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="border border-[#c5a46e]/40 rounded-2xl bg-[#0f172a] p-6 space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Phase 2C — Step 1</div>
        <h2 className="font-semibold text-lg mt-0.5">PandaDoc Retainer Agreement</h2>
        <p className="text-sm text-[#94a3b8] mt-1">
          Creates a draft from your saved template with client name, company, website, logo, proposal date, and
          activation retainer pre-filled. Open in PandaDoc to add your signature (if not already on the template),
          confirm payment, then send — the site does not send automatically.
        </p>
      </div>

      {configured === false && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 px-4 py-3 text-sm text-amber-100">
          Add these in Vercel → Settings → Environment Variables, then <strong>Redeploy</strong> (required):{' '}
          <span className="font-mono text-xs">{missingEnv.join(', ')}</span>
        </div>
      )}

      {panelMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            panelIsError
              ? 'border-red-500/40 bg-red-900/20 text-red-100'
              : 'border-emerald-500/40 bg-emerald-900/20 text-emerald-100'
          }`}
        >
          {panelMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 text-sm">
        <div>
          <label className="block text-[#cbd5e1] mb-1.5" htmlFor="pandadoc-company">
            Client company (maps to {'{Client.Company}'})
          </label>
          <input
            id="pandadoc-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full bg-[#111827] border border-white/20 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#c5a46e]"
            placeholder="Acme Manufacturing LLC"
          />
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Will pre-fill</div>
          <div className="text-[#e2e8f0]">{submission.name}</div>
          <div className="text-[#94a3b8]">{submission.email}</div>
          <div className="text-[#94a3b8]">Website: michaelhartconsulting.com</div>
          {fees ? (
            <div className="text-[#c5a46e]">Retainer: {formatUsd(fees.activationFee)}</div>
          ) : (
            <div className="text-amber-200">Save Engagement Economics quote first</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCreate}
          disabled={!canCreate}
          className="px-6 py-2.5 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-40"
        >
          {creating ? 'Creating in PandaDoc…' : 'Create retainer draft in PandaDoc'}
        </button>

        {submission.pandadocRetainer && (
          <a
            href={submission.pandadocRetainer.editUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 text-sm rounded-full border border-[#c5a46e]/50 text-[#c5a46e] hover:bg-[#c5a46e]/10"
          >
            Open latest draft in PandaDoc
          </a>
        )}
      </div>

      {submission.pandadocRetainer && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 px-4 py-3 text-xs text-emerald-100 space-y-1">
          <div>
            Draft linked — {new Date(submission.pandadocRetainer.createdAt).toLocaleString()}
          </div>
          <div className="text-[#94a3b8]">
            {formatUsd(submission.pandadocRetainer.activationFee)} · status {submission.pandadocRetainer.status}
          </div>
          <div className="text-[#64748b] font-mono break-all">{submission.pandadocRetainer.documentId}</div>
        </div>
      )}

      <ol className="text-xs text-[#64748b] list-decimal list-inside space-y-1">
        <li>Website and retainer tokens fill automatically; logo fills only if the template has an Image block</li>
        <li>Sign your contractor fields once in PandaDoc (signature fields cannot be filled by API)</li>
        <li>Confirm Collect payment amount matches the retainer above</li>
        <li>Send to client — they sign and pay in PandaDoc</li>
        <li>Mark Step 8 below when complete (Step 2 will automate this)</li>
      </ol>
    </section>
  );
}
