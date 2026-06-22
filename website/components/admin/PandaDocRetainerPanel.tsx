'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';
import {
  createPandaDocFinalBalanceForAdmin,
  createPandaDocNdaForAdmin,
  createPandaDocRetainerForAdmin,
  getPandaDocBalanceIntegrationStatusForAdmin,
  getPandaDocIntegrationStatusForAdmin,
  getPandaDocNdaIntegrationStatusForAdmin,
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
  const [creatingNda, setCreatingNda] = useState(false);
  const [creatingBalance, setCreatingBalance] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [ndaConfigured, setNdaConfigured] = useState<boolean | null>(null);
  const [balanceConfigured, setBalanceConfigured] = useState<boolean | null>(null);
  const [missingEnv, setMissingEnv] = useState<string[]>([]);
  const [ndaMissingEnv, setNdaMissingEnv] = useState<string[]>([]);
  const [balanceMissingEnv, setBalanceMissingEnv] = useState<string[]>([]);
  const [panelMessage, setPanelMessage] = useState('');
  const [panelIsError, setPanelIsError] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      const [retainerRes, balanceRes, ndaRes] = await Promise.all([
        getPandaDocIntegrationStatusForAdmin(),
        getPandaDocBalanceIntegrationStatusForAdmin(),
        getPandaDocNdaIntegrationStatusForAdmin(),
      ]);
      if (retainerRes.success) {
        setConfigured(retainerRes.configured);
        setMissingEnv(retainerRes.configured ? [] : retainerRes.missing || []);
      }
      if (balanceRes.success) {
        setBalanceConfigured(balanceRes.configured);
        setBalanceMissingEnv(balanceRes.configured ? [] : balanceRes.missing || []);
      }
      if (ndaRes.success) {
        setNdaConfigured(ndaRes.configured);
        setNdaMissingEnv(ndaRes.configured ? [] : ndaRes.missing || []);
      }
    });
  }, []);

  const fees = useMemo(() => {
    if (!submission.engagementQuote) return null;
    return effectiveQuoteFees(submission.engagementQuote);
  }, [submission.engagementQuote]);

  const canCreateNda =
    ndaConfigured === true &&
    configured === true &&
    !creating &&
    !creatingNda &&
    !creatingBalance &&
    company.trim().length > 0;

  const canCreate =
    configured === true &&
    !!submission.engagementQuote?.savedAt &&
    !!fees &&
    fees.activationFee > 0 &&
    !creating &&
    !creatingNda &&
    !creatingBalance &&
    company.trim().length > 0;

  const canCreateBalance =
    balanceConfigured === true &&
    configured === true &&
    !!submission.engagementQuote?.savedAt &&
    !!submission.engagementCommittedAt &&
    !!fees &&
    fees.balanceDue > 0 &&
    !creating &&
    !creatingNda &&
    !creatingBalance &&
    company.trim().length > 0;

  function clientDetailsPayload() {
    return { company, streetAddress, city, state, postalCode };
  }

  function openPandaDocTab(editUrl: string, baseMessage: string) {
    const opened = window.open(editUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      const popupNote = ' Popup blocked — use Open in PandaDoc below.';
      setPanelMessage(baseMessage + popupNote);
      onStatus(baseMessage + popupNote);
      return baseMessage + popupNote;
    }
    return baseMessage;
  }

  async function handleCreateNda() {
    if (!canCreateNda) return;
    setCreatingNda(true);
    setPanelMessage('');
    setPanelIsError(false);

    try {
      const res = await createPandaDocNdaForAdmin(submission.id, clientDetailsPayload());
      if (res.success) {
        onUpdated(res.submission);
        const message = res.editUrl
          ? openPandaDocTab(res.editUrl, res.message)
          : res.message;
        setPanelMessage(message);
        setPanelIsError(false);
        onStatus(message);
      } else {
        const err = res.error || 'PandaDoc NDA request failed.';
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
      setCreatingNda(false);
    }
  }

  async function handleCreate() {
    if (!canCreate) return;
    setCreating(true);
    setPanelMessage('');
    setPanelIsError(false);

    try {
      const res = await createPandaDocRetainerForAdmin(submission.id, clientDetailsPayload());
      if (res.success) {
        onUpdated(res.submission);
        const message = res.editUrl
          ? openPandaDocTab(res.editUrl, res.message)
          : res.message;
        setPanelMessage(message);
        setPanelIsError(false);
        onStatus(message);
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

  async function handleCreateBalance() {
    if (!canCreateBalance) return;
    setCreatingBalance(true);
    setPanelMessage('');
    setPanelIsError(false);

    try {
      const res = await createPandaDocFinalBalanceForAdmin(
        submission.id,
        clientDetailsPayload(),
      );
      if (res.success) {
        onUpdated(res.submission);
        const message = res.editUrl
          ? openPandaDocTab(res.editUrl, res.message)
          : res.message;
        setPanelMessage(message);
        setPanelIsError(false);
        onStatus(message);
      } else {
        const err = res.error || 'PandaDoc invoice request failed.';
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
      setCreatingBalance(false);
    }
  }

  const inputClass =
    'w-full bg-[#111827] border border-white/20 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#c5a46e]';

  return (
    <section id="phase-documents" className="border border-[#c5a46e]/40 rounded-2xl bg-[#0f172a] p-6 space-y-5 scroll-mt-24">
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Phase 3 — Documents</div>
        <h2 className="font-semibold text-lg mt-0.5">PandaDoc — NDA, Retainer & Balance</h2>
        <p className="text-sm text-[#94a3b8] mt-1">
          Creates drafts with client details pre-filled, then opens PandaDoc. NDA is sign-only; retainer and
          invoice include Collect payment. You review and send manually.
        </p>
      </div>

      {configured === false && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 px-4 py-3 text-sm text-amber-100">
          Add these in Vercel → Settings → Environment Variables, then <strong>Redeploy</strong> (required):{' '}
          <span className="font-mono text-xs">{missingEnv.join(', ')}</span>
        </div>
      )}

      {ndaConfigured === false && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 px-4 py-3 text-sm text-amber-100">
          Mutual NDA: add{' '}
          <span className="font-mono text-xs">{ndaMissingEnv.join(', ')}</span> in Vercel, then{' '}
          <strong>Redeploy</strong>.
        </div>
      )}

      {balanceConfigured === false && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 px-4 py-3 text-sm text-amber-100">
          Final balance invoice: add{' '}
          <span className="font-mono text-xs">{balanceMissingEnv.join(', ')}</span> in Vercel, then{' '}
          <strong>Redeploy</strong>.
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
            <>
              <div className="text-[#c5a46e]">Retainer: {formatUsd(fees.activationFee)}</div>
              <div className="text-[#94a3b8]">Total Phase 1: {formatUsd(fees.totalFee)}</div>
              <div className="text-[#94a3b8]">Balance at delivery: {formatUsd(fees.balanceDue)}</div>
              <div className="text-[#64748b]">{fees.creditPercent}% activation credited</div>
            </>
          ) : (
            <div className="text-amber-200">Save Engagement Economics quote first</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-violet-500/25 bg-violet-950/10 p-4 flex flex-col gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-violet-300/80">NDA</div>
            <div className="font-semibold text-[#f1f5f9] mt-1">Mutual NDA</div>
            <p className="text-xs text-[#94a3b8] mt-1">Sign only — before sharing confidential materials</p>
            <p className="text-[11px] text-violet-200/80 mt-2 leading-relaxed">
              If PandaDoc shows a green <span className="text-violet-100">Set up payment</span> step, remove{' '}
              <span className="text-violet-100">Collect payment</span> from the NDA template workflow — our API
              does not add payment to NDAs.
            </p>
          </div>
          {submission.pandadocNda ? (
            <div className="text-xs text-emerald-300/90">
              ✓ Draft linked · {new Date(submission.pandadocNda.createdAt).toLocaleDateString()}
            </div>
          ) : (
            <div className="text-xs text-[#64748b]">No draft yet</div>
          )}
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCreateNda}
              disabled={!canCreateNda}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-40"
            >
              {creatingNda ? 'Creating…' : 'Generate NDA'}
            </button>
            {submission.pandadocNda && (
              <a
                href={submission.pandadocNda.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center px-4 py-2 text-xs rounded-full border border-violet-400/40 text-violet-200 hover:bg-violet-900/20"
              >
                Open NDA draft
              </a>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/10 p-4 flex flex-col gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">Agreement</div>
            <div className="font-semibold text-[#f1f5f9] mt-1">Activation Retainer</div>
            <p className="text-xs text-[#94a3b8] mt-1">
              {fees ? `${formatUsd(fees.activationFee)} due at signing` : 'Save pricing quote first'}
            </p>
          </div>
          {submission.pandadocRetainer ? (
            <div className="text-xs text-emerald-300/90">
              ✓ Draft linked · {formatUsd(submission.pandadocRetainer.activationFee)}
            </div>
          ) : (
            <div className="text-xs text-[#64748b]">No draft yet</div>
          )}
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-40"
            >
              {creating ? 'Creating…' : 'Generate Retainer'}
            </button>
            {submission.pandadocRetainer && (
              <a
                href={submission.pandadocRetainer.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center px-4 py-2 text-xs rounded-full border border-emerald-400/40 text-emerald-200 hover:bg-emerald-900/20"
              >
                Open retainer draft
              </a>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-sky-500/25 bg-sky-950/10 p-4 flex flex-col gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-sky-300/80">Delivery</div>
            <div className="font-semibold text-[#f1f5f9] mt-1">Final Balance Invoice</div>
            <p className="text-xs text-[#94a3b8] mt-1">
              {fees ? `${formatUsd(fees.balanceDue)} due at delivery` : 'Save pricing quote first'}
            </p>
          </div>
          {submission.pandadocFinalBalance ? (
            <div className="text-xs text-sky-300/90">
              ✓ Draft linked · {formatUsd(submission.pandadocFinalBalance.balanceDue)}
            </div>
          ) : (
            <div className="text-xs text-[#64748b]">
              {!submission.engagementCommittedAt ? 'Requires agreement & payment' : 'No draft yet'}
            </div>
          )}
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCreateBalance}
              disabled={!canCreateBalance}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-40"
            >
              {creatingBalance ? 'Creating…' : 'Generate Invoice'}
            </button>
            {submission.pandadocFinalBalance && (
              <a
                href={submission.pandadocFinalBalance.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center px-4 py-2 text-xs rounded-full border border-sky-400/40 text-sky-200 hover:bg-sky-900/20"
              >
                Open invoice draft
              </a>
            )}
          </div>
        </div>
      </div>

      {submission.pandadocRetainer && (
        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">
            Paste into PandaDoc when you send retainer
          </div>
          <p className="text-[#cbd5e1] leading-relaxed">{PANDADOC_RETAINER_SEND_MESSAGE}</p>
        </div>
      )}

      <ol className="text-xs text-[#64748b] list-decimal list-inside space-y-1">
        <li>NDA: pre-sign Owner (Michael), send to Recipient — no payment (remove Collect payment from template if PandaDoc prompts)</li>
        <li>Retainer: confirm Collect = activation fee, send to client</li>
        <li>Mark agreement & payment when retainer is signed and paid</li>
        <li>After delivery: generate final balance invoice and send</li>
        <li>Grant portal access within {PORTAL_ACCESS_SLA} after agreement</li>
      </ol>
    </section>
  );
}
