'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';
import {
  createPandaDocRetainerForAdmin,
  getPandaDocIntegrationStatusForAdmin,
} from '@/app/actions';
import { PANDADOC_RETAINER_SEND_MESSAGE } from '@/lib/pandadoc/send-message';
import { PORTAL_ACCESS_SLA } from '@/lib/portal-client-copy';

interface Props {
  submission: PrepSubmission;
  onUpdated: (submission: PrepSubmission) => void;
  onStatus: (message: string, isError?: boolean) => void;
}

export default function PandaDocRetainerPanel({ submission, onUpdated, onStatus }: Props) {
  const [company, setCompany] = useState(
    () => submission.clientCompany || submission.industry || '',
  );
  const [streetAddress, setStreetAddress] = useState(
    () => submission.clientStreetAddress || '',
  );
  const [city, setCity] = useState(() => submission.clientCity || '');
  const [state, setState] = useState(() => submission.clientState || '');
  const [postalCode, setPostalCode] = useState(() => submission.clientPostalCode || '');
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
    !creating &&
    company.trim().length > 0;

  async function handleCreate() {
    if (!canCreate) return;
    setCreating(true);
    setPanelMessage('');
    setPanelIsError(false);

    try {
      const res = await createPandaDocRetainerForAdmin(submission.id, {
        company,
        streetAddress,
        city,
        state,
        postalCode,
      });
      if (res.success) {
        onUpdated(res.submission);
        setPanelMessage(res.message);
        setPanelIsError(false);
        onStatus(res.message);
        if (res.editUrl) {
          const opened = window.open(res.editUrl, '_blank', 'noopener,noreferrer');
          if (!opened) {
            const popupNote =
              ' Popup blocked — use Open latest draft in PandaDoc below.';
            setPanelMessage(res.message + popupNote);
            onStatus(res.message + popupNote);
          }
        }
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

  const inputClass =
    'w-full bg-[#111827] border border-white/20 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#c5a46e]';

  return (
    <section className="border border-[#c5a46e]/40 rounded-2xl bg-[#0f172a] p-6 space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Phase 2C — Step 1</div>
        <h2 className="font-semibold text-lg mt-0.5">PandaDoc Retainer Agreement</h2>
        <p className="text-sm text-[#94a3b8] mt-1">
          Creates a draft from your saved template with client name, company, address, website, and activation
          retainer pre-filled, then opens PandaDoc in a new tab. Sign, confirm payment, then send — the site does not send
          automatically.
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

      <div className="grid gap-4 lg:grid-cols-2 text-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-[#cbd5e1] mb-1.5" htmlFor="pandadoc-company">
              Client company (maps to [Client.Company])
            </label>
            <input
              id="pandadoc-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={inputClass}
              placeholder="Acme Manufacturing LLC"
            />
          </div>
          <div>
            <label className="block text-[#cbd5e1] mb-1.5" htmlFor="pandadoc-street">
              Street address (optional — [Client.StreetAddress])
            </label>
            <input
              id="pandadoc-street"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className={inputClass}
              placeholder="123 Main Street"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="block text-[#cbd5e1] mb-1.5" htmlFor="pandadoc-city">
                City
              </label>
              <input
                id="pandadoc-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
                placeholder="Atlanta"
              />
            </div>
            <div>
              <label className="block text-[#cbd5e1] mb-1.5" htmlFor="pandadoc-state">
                State
              </label>
              <input
                id="pandadoc-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={inputClass}
                placeholder="GA"
              />
            </div>
            <div>
              <label className="block text-[#cbd5e1] mb-1.5" htmlFor="pandadoc-zip">
                ZIP
              </label>
              <input
                id="pandadoc-zip"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className={inputClass}
                placeholder="30301"
              />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 space-y-1 h-fit">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Will pre-fill</div>
          <div className="text-[#e2e8f0]">{submission.name}</div>
          <div className="text-[#94a3b8]">{submission.email}</div>
          {company.trim() && <div className="text-[#94a3b8]">{company.trim()}</div>}
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
        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">
            Paste into PandaDoc when you send
          </div>
          <p className="text-[#cbd5e1] leading-relaxed">{PANDADOC_RETAINER_SEND_MESSAGE}</p>
        </div>
      )}

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
        <li>Template variables must use [Client.Company] format (same as [Company website])</li>
        <li>Sign your contractor fields in PandaDoc before sending (signatures cannot be filled by API)</li>
        <li>Confirm Collect payment amount matches the retainer above</li>
        <li>Send to client — they sign and pay in PandaDoc</li>
        <li>Mark Step 8 below when complete, then grant portal access within {PORTAL_ACCESS_SLA} (Step 2 will automate Step 8)</li>
      </ol>
    </section>
  );
}
