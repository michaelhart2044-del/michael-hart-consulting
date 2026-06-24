'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';
import {
  createOwnedNdaForAdmin,
  createOwnedRetainerForAdmin,
  generateOwnedPaymentInstructionForAdmin,
  getOwnedDocumentsIntegrationStatusForAdmin,
  getQuickBooksInvoiceDraftForAdmin,
} from '@/app/actions';
import { PAYMENT_POLICY_SHORT } from '@/lib/documents/payment-policy';
import { PORTAL_ACCESS_SLA } from '@/lib/portal-client-copy';
import {
  isOwnedSignWellDocComplete,
  ownedSignWellStatusLabel,
  ownedSignWellStatusTone,
  type OwnedSignWellDocRecord,
} from '@/lib/signwell/owned-doc-status';
import {
  useOwnedClientDetails,
  type OwnedClientDetailsState,
} from '@/components/admin/owned-docs/use-owned-client-details';
import ActivationFlowChecklist from '@/components/admin/owned-docs/ActivationFlowChecklist';
import { buildPaymentPackageEmailDraft } from '@/lib/quickbooks/payment-email-draft';
import { openMailtoDraft } from '@/lib/open-mailto-draft';

export type OwnedDocumentsPanelPart = 'nda' | 'agreement' | 'full';

interface Props {
  submission: PrepSubmission;
  onUpdated: (submission: PrepSubmission) => void;
  onStatus: (message: string, isError?: boolean) => void;
  part?: OwnedDocumentsPanelPart;
  clientDetails?: OwnedClientDetailsState;
}

function downloadBase64Pdf(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function signWellStatusClass(tone: ReturnType<typeof ownedSignWellStatusTone>): string {
  if (tone === 'success') return 'text-emerald-300';
  if (tone === 'warning') return 'text-amber-200';
  if (tone === 'error') return 'text-red-300';
  return 'text-[#94a3b8]';
}

function OpenSignWellLink({ editUrl }: { editUrl: string }) {
  return (
    <a
      href={editUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex text-xs font-medium text-violet-200 hover:text-violet-100 underline underline-offset-2"
    >
      Open in SignWell →
    </a>
  );
}

function SignWellRetainerSteps() {
  return (
    <ol className="text-[11px] text-[#64748b] list-decimal list-inside space-y-0.5 mt-1">
      <li>Open SignWell → sign as Owner</li>
      <li>Send to client (retainer only — no payment)</li>
      <li>Use Refresh status when signing is complete</li>
    </ol>
  );
}

function OwnedDocSignWellStatus({ doc }: { doc: OwnedSignWellDocRecord }) {
  const label = ownedSignWellStatusLabel(doc);
  if (!label) return null;
  return <div className={signWellStatusClass(ownedSignWellStatusTone(doc))}>{label}</div>;
}

export default function OwnedDocumentsPanel({
  submission,
  onUpdated,
  onStatus,
  part = 'full',
  clientDetails: clientDetailsProp,
}: Props) {
  const internalDetails = useOwnedClientDetails(submission);
  const clientDetails = clientDetailsProp ?? internalDetails;
  const {
    company,
    setCompany,
    streetAddress,
    setStreetAddress,
    city,
    setCity,
    state,
    setState,
    postalCode,
    setPostalCode,
  } = clientDetails;
  const [creatingNda, setCreatingNda] = useState(false);
  const [creatingRetainer, setCreatingRetainer] = useState(false);
  const [generatingActivationPdf, setGeneratingActivationPdf] = useState(false);
  const [generatingBalancePdf, setGeneratingBalancePdf] = useState(false);
  const [ndaConfigured, setNdaConfigured] = useState<boolean | null>(null);
  const [retainerConfigured, setRetainerConfigured] = useState<boolean | null>(null);
  const [paymentConfigured, setPaymentConfigured] = useState<boolean | null>(null);
  const [ndaMissingEnv, setNdaMissingEnv] = useState<string[]>([]);
  const [retainerMissingEnv, setRetainerMissingEnv] = useState<string[]>([]);
  const [paymentMissingEnv, setPaymentMissingEnv] = useState<string[]>([]);
  const [panelMessage, setPanelMessage] = useState('');
  const [panelIsError, setPanelIsError] = useState(false);
  const [qboDraft, setQboDraft] = useState<string | null>(null);
  const [activationQboInvoiceNumber, setActivationQboInvoiceNumber] = useState('');
  const [balanceQboInvoiceNumber, setBalanceQboInvoiceNumber] = useState('');

  useEffect(() => {
    queueMicrotask(async () => {
      const res = await getOwnedDocumentsIntegrationStatusForAdmin();
      if (!res.success) return;
      setNdaConfigured(res.ndaConfigured);
      setRetainerConfigured(res.retainerConfigured);
      setPaymentConfigured(res.paymentConfigured);
      setNdaMissingEnv(res.ndaMissing || []);
      setRetainerMissingEnv(res.retainerMissing || []);
      setPaymentMissingEnv(res.paymentMissing || []);
    });
  }, []);

  const fees = useMemo(() => {
    if (!submission.engagementQuote) return null;
    return effectiveQuoteFees(submission.engagementQuote);
  }, [submission.engagementQuote]);

  const busy = creatingNda || creatingRetainer || generatingActivationPdf || generatingBalancePdf;

  const canCreateNda =
    ndaConfigured === true && !busy && company.trim().length > 0;

  const canCreateRetainer =
    retainerConfigured === true &&
    !!submission.engagementQuote?.savedAt &&
    !!fees &&
    fees.activationFee > 0 &&
    !busy &&
    company.trim().length > 0;

  const retainerSignedForPayment =
    !!submission.engagementCommittedAt ||
    isOwnedSignWellDocComplete(submission.ownedDocuments?.retainer);

  const canGenerateActivationPdf =
    !!fees &&
    fees.activationFee > 0 &&
    retainerSignedForPayment &&
    !busy &&
    company.trim().length > 0;

  const canGenerateBalancePdf =
    !!submission.engagementCommittedAt &&
    !!fees &&
    fees.balanceDue > 0 &&
    !busy &&
    company.trim().length > 0;

  function clientDetailsPayload() {
    return clientDetails.payload();
  }

  function openSignWellTab(editUrl: string, baseMessage: string) {
    const opened = window.open(editUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      const popupNote = ' Popup blocked — allow popups for this site and click the button again.';
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
      const res = await createOwnedNdaForAdmin(submission.id, clientDetailsPayload());
      if (res.success) {
        onUpdated(res.submission);
        const message = res.editUrl
          ? openSignWellTab(res.editUrl, res.message)
          : res.message;
        setPanelMessage(message);
        onStatus(message);
      } else {
        setPanelMessage(res.error);
        setPanelIsError(true);
        onStatus(res.error, true);
      }
    } catch {
      const err = 'Request failed — check SignWell env vars and redeploy if needed.';
      setPanelMessage(err);
      setPanelIsError(true);
      onStatus(err, true);
    } finally {
      setCreatingNda(false);
    }
  }

  async function handleCreateRetainer() {
    if (!canCreateRetainer) return;
    setCreatingRetainer(true);
    setPanelMessage('');
    setPanelIsError(false);
    try {
      const res = await createOwnedRetainerForAdmin(submission.id, clientDetailsPayload());
      if (res.success) {
        onUpdated(res.submission);
        const message = res.editUrl
          ? openSignWellTab(res.editUrl, res.message)
          : res.message;
        setPanelMessage(message);
        onStatus(message);
      } else {
        setPanelMessage(res.error);
        setPanelIsError(true);
        onStatus(res.error, true);
      }
    } catch {
      const err = 'Request failed — check SignWell env vars and redeploy if needed.';
      setPanelMessage(err);
      setPanelIsError(true);
      onStatus(err, true);
    } finally {
      setCreatingRetainer(false);
    }
  }

  async function handleGeneratePdf(kind: 'activation' | 'balance') {
    const can = kind === 'activation' ? canGenerateActivationPdf : canGenerateBalancePdf;
    if (!can) return;
    if (kind === 'activation') setGeneratingActivationPdf(true);
    else setGeneratingBalancePdf(true);
    setPanelMessage('');
    setPanelIsError(false);
    try {
      const res = await generateOwnedPaymentInstructionForAdmin(
        submission.id,
        kind,
        clientDetailsPayload(),
      );
      if (res.success) {
        onUpdated(res.submission);
        downloadBase64Pdf(res.pdfBase64, res.filename);
        setPanelMessage(res.message);
        onStatus(res.message);
      } else {
        setPanelMessage(res.error);
        setPanelIsError(true);
        onStatus(res.error, true);
      }
    } catch {
      const err = 'PDF generation failed.';
      setPanelMessage(err);
      setPanelIsError(true);
      onStatus(err, true);
    } finally {
      if (kind === 'activation') setGeneratingActivationPdf(false);
      else setGeneratingBalancePdf(false);
    }
  }

  function openPaymentEmailDraft(kind: 'activation' | 'balance') {
    const can = kind === 'activation' ? canGenerateActivationPdf : canGenerateBalancePdf;
    if (!can) return;

    if (!submission.email?.trim()) {
      const err = 'Client email is missing on this submission.';
      setPanelMessage(err);
      setPanelIsError(true);
      onStatus(err, true);
      return;
    }

    const qboInvoiceNumber =
      kind === 'activation' ? activationQboInvoiceNumber : balanceQboInvoiceNumber;

    const draft = buildPaymentPackageEmailDraft(
      submission,
      kind,
      clientDetailsPayload(),
      qboInvoiceNumber,
    );

    if (!draft) {
      const err = 'Save engagement pricing and company name first.';
      setPanelMessage(err);
      setPanelIsError(true);
      onStatus(err, true);
      return;
    }

    const opened = openMailtoDraft({
      to: draft.to,
      subject: draft.subject,
      body: draft.body,
    });

    if (!opened) {
      const err = 'Could not open email client — copy subject and body manually if needed.';
      setPanelMessage(err);
      setPanelIsError(true);
      onStatus(err, true);
      return;
    }

    setPanelMessage(draft.attachmentHint);
    setPanelIsError(false);
    onStatus('Outlook opened — attach QBO invoice PDF + remittance PDF, then send.');
  }

  async function handleCopyQboDraft(kind: 'activation' | 'balance') {
    setPanelMessage('');
    setPanelIsError(false);
    try {
      const res = await getQuickBooksInvoiceDraftForAdmin(
        submission.id,
        kind,
        clientDetailsPayload(),
      );
      if (res.success) {
        setQboDraft(res.draft.copyBlock);
        await navigator.clipboard.writeText(res.draft.copyBlock);
        const msg =
          'QuickBooks invoice draft copied. Create invoice in QBO with card payments OFF — send remittance PDF with it.';
        setPanelMessage(msg);
        onStatus(msg);
      } else {
        setPanelMessage(res.error);
        setPanelIsError(true);
        onStatus(res.error, true);
      }
    } catch {
      const err = 'Could not copy invoice draft.';
      setPanelMessage(err);
      setPanelIsError(true);
      onStatus(err, true);
    }
  }

  const inputClass =
    'w-full bg-[#111827] border border-white/20 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#c5a46e]';

  const owned = submission.ownedDocuments;
  const showNda = part === 'nda' || part === 'full';
  const showAgreement = part === 'agreement' || part === 'full';
  const sectionId =
    part === 'nda' ? 'phase-nda' : part === 'agreement' ? 'phase-agreement' : 'phase-documents';

  const clientDetailsForm = (
    <div className="grid gap-4 lg:grid-cols-2 text-sm">
      <div className="space-y-4">
        <div>
          <label className="block text-[#cbd5e1] mb-1.5" htmlFor={`owned-company-${part}`}>
            Client company
          </label>
          <input
            id={`owned-company-${part}`}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
            placeholder="Acme Manufacturing LLC"
          />
        </div>
        <div>
          <label className="block text-[#cbd5e1] mb-1.5" htmlFor={`owned-street-${part}`}>
            Street address (optional)
          </label>
          <input
            id={`owned-street-${part}`}
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            className={inputClass}
            placeholder="123 Main Street"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-[#cbd5e1] mb-1.5" htmlFor={`owned-city-${part}`}>
              City
            </label>
            <input
              id={`owned-city-${part}`}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
              placeholder="Atlanta"
            />
          </div>
          <div>
            <label className="block text-[#cbd5e1] mb-1.5" htmlFor={`owned-state-${part}`}>
              State
            </label>
            <input
              id={`owned-state-${part}`}
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputClass}
              placeholder="GA"
            />
          </div>
          <div>
            <label className="block text-[#cbd5e1] mb-1.5" htmlFor={`owned-zip-${part}`}>
              ZIP
            </label>
            <input
              id={`owned-zip-${part}`}
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
        {fees ? (
          <>
            <div className="text-[#c5a46e]">Activation: {formatUsd(fees.activationFee)}</div>
            <div className="text-[#94a3b8]">Total Phase 1: {formatUsd(fees.totalFee)}</div>
            <div className="text-[#94a3b8]">Balance at delivery: {formatUsd(fees.balanceDue)}</div>
          </>
        ) : (
          <div className="text-amber-200">Save Engagement Economics quote first</div>
        )}
      </div>
    </div>
  );

  return (
    <section id={sectionId} className="border border-[#c5a46e]/40 rounded-2xl bg-[#0f172a] p-6 space-y-5 scroll-mt-24">
      <div>
        {part === 'nda' && (
          <>
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Step A — Confidentiality</div>
            <h2 className="font-semibold text-lg mt-0.5">Mutual NDA</h2>
            <p className="text-sm text-[#94a3b8] mt-1">
              After internal pricing is saved — generate, pre-sign as Owner, and send before the scope proposal.
            </p>
          </>
        )}
        {part === 'agreement' && (
          <>
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Step B — Activation agreement</div>
            <h2 className="font-semibold text-lg mt-0.5">Retainer, invoice & payment</h2>
            <p className="text-sm text-[#94a3b8] mt-1">
              After the proposal is sent — SignWell retainer, QuickBooks invoice, and remittance PDF.{' '}
              <span className="text-[#c5a46e]">{PAYMENT_POLICY_SHORT.toLowerCase()}</span>
            </p>
            <ActivationFlowChecklist submission={submission} />
          </>
        )}
        {part === 'full' && (
          <>
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Phase 4 — Documents</div>
            <h2 className="font-semibold text-lg mt-0.5">Owned documents — SignWell & QuickBooks</h2>
            <p className="text-sm text-[#94a3b8] mt-1">
              Your templates in SignWell for e-sign. Payments via QuickBooks invoice + remittance PDF only —{' '}
              <span className="text-[#c5a46e]">{PAYMENT_POLICY_SHORT.toLowerCase()}</span>
            </p>
          </>
        )}
      </div>

      {ndaConfigured === false && showNda && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 px-4 py-3 text-sm text-amber-100">
          SignWell NDA: add{' '}
          <span className="font-mono text-xs">{ndaMissingEnv.join(', ')}</span> in Vercel, then{' '}
          <strong>Redeploy</strong>.
        </div>
      )}

      {retainerConfigured === false && showAgreement && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 px-4 py-3 text-sm text-amber-100">
          SignWell retainer: add{' '}
          <span className="font-mono text-xs">{retainerMissingEnv.join(', ')}</span> in Vercel, then{' '}
          <strong>Redeploy</strong>.
        </div>
      )}

      {paymentConfigured === false && showAgreement && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 px-4 py-3 text-sm text-amber-100">
          Wire/ACH details for remittance PDFs: add{' '}
          <span className="font-mono text-xs">{paymentMissingEnv.join(', ')}</span> in Vercel, then{' '}
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

      {(part === 'nda' || part === 'full') && clientDetailsForm}

      {part === 'agreement' && (
        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#94a3b8]">
          Pre-fill uses client details from Step A —{' '}
          <span className="text-[#e2e8f0]">{company.trim() || submission.name}</span>
          {company.trim() ? '' : ' (add company in NDA step above)'}
        </div>
      )}

      <div
        className={`grid gap-4 ${showAgreement && !showNda ? 'md:grid-cols-2 lg:grid-cols-3' : showNda && !showAgreement ? 'max-w-md' : 'md:grid-cols-2 lg:grid-cols-4'}`}
      >
        {showNda && (
        <div className="rounded-xl border border-violet-500/25 bg-violet-950/10 p-4 flex flex-col gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-violet-300/80">NDA</div>
            <div className="font-semibold text-[#f1f5f9] mt-1">Mutual NDA</div>
            <p className="text-xs text-[#94a3b8] mt-1">SignWell — sign only, no payment</p>
          </div>
          {owned?.nda ? (
            <div className="text-xs space-y-1">
              <div className="text-emerald-300/90">
                ✓ Draft linked · {new Date(owned.nda.createdAt).toLocaleDateString()}
              </div>
              <OwnedDocSignWellStatus doc={owned.nda} />
              <div className="text-[#94a3b8]">
                Regenerate creates a new SignWell draft and opens it (uses 1 daily slot).
              </div>
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
              {creatingNda ? 'Creating…' : owned?.nda ? 'Regenerate NDA' : 'Generate NDA'}
            </button>
          </div>
        </div>
        )}

        {showAgreement && (
        <>
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/10 p-4 flex flex-col gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">Agreement</div>
            <div className="font-semibold text-[#f1f5f9] mt-1">Activation Retainer</div>
            <p className="text-xs text-[#94a3b8] mt-1">
              {fees ? `${formatUsd(fees.activationFee)} — sign then pay by ACH/wire/check` : 'Save pricing first'}
            </p>
          </div>
          {owned?.retainer ? (
            <div className="text-xs space-y-1">
              <div className="text-emerald-300/90">✓ Draft linked · {formatUsd(owned.retainer.activationFee)}</div>
              <OwnedDocSignWellStatus doc={owned.retainer} />
              <div className="text-[#94a3b8]">
                Regenerate creates a new SignWell draft and opens it (uses 1 daily slot).
              </div>
              {!isOwnedSignWellDocComplete(owned.retainer) && <SignWellRetainerSteps />}
            </div>
          ) : (
            <div className="text-xs text-[#64748b]">No draft yet</div>
          )}
          <div className="mt-auto flex flex-col gap-2">
            {owned?.retainer?.editUrl && <OpenSignWellLink editUrl={owned.retainer.editUrl} />}
            <button
              type="button"
              onClick={handleCreateRetainer}
              disabled={!canCreateRetainer}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-40"
            >
              {creatingRetainer ? 'Creating…' : owned?.retainer ? 'Regenerate Retainer' : 'Generate Retainer'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-950/10 p-4 flex flex-col gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-amber-300/80">Payment</div>
            <div className="font-semibold text-[#f1f5f9] mt-1">Activation invoice</div>
            <p className="text-xs text-[#94a3b8] mt-1">QBO invoice + remittance PDF</p>
          </div>
          {!retainerSignedForPayment && (
            <div className="text-xs text-amber-200/90">
              Fully sign the activation retainer in SignWell first.
            </div>
          )}
          {owned?.activationPayment ? (
            <div className="text-xs text-amber-200/90">
              ✓ PDF generated · ref {owned.activationPayment.reference}
            </div>
          ) : (
            <div className="text-xs text-[#64748b]">Not generated yet</div>
          )}
          <label className="text-xs text-[#94a3b8] block">
            QBO invoice #
            <input
              type="text"
              inputMode="numeric"
              value={activationQboInvoiceNumber}
              onChange={(e) => setActivationQboInvoiceNumber(e.target.value)}
              placeholder="1002"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-[#f1f5f9] placeholder:text-[#64748b]"
            />
          </label>
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleGeneratePdf('activation')}
              disabled={!canGenerateActivationPdf}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-40"
            >
              {generatingActivationPdf ? 'Generating…' : 'Download remittance PDF'}
            </button>
            <button
              type="button"
              onClick={() => openPaymentEmailDraft('activation')}
              disabled={!canGenerateActivationPdf}
              className="w-full px-4 py-2 text-sm font-medium rounded-full border border-amber-400/50 text-amber-100 hover:bg-amber-900/25 disabled:opacity-40"
            >
              Open email draft (Outlook)
            </button>
            <button
              type="button"
              onClick={() => handleCopyQboDraft('activation')}
              disabled={!canGenerateActivationPdf}
              className="w-full px-4 py-2 text-xs rounded-full border border-amber-400/40 text-amber-200 hover:bg-amber-900/20 disabled:opacity-40"
            >
              Copy QBO invoice draft
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-sky-500/25 bg-sky-950/10 p-4 flex flex-col gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-sky-300/80">Delivery</div>
            <div className="font-semibold text-[#f1f5f9] mt-1">Final balance</div>
            <p className="text-xs text-[#94a3b8] mt-1">
              {fees ? `${formatUsd(fees.balanceDue)} at delivery` : 'Save pricing first'}
            </p>
          </div>
          {owned?.balancePayment ? (
            <div className="text-xs text-sky-300/90">
              ✓ PDF generated · ref {owned.balancePayment.reference}
            </div>
          ) : (
            <div className="text-xs text-[#64748b]">
              {!submission.engagementCommittedAt ? 'Requires agreement & payment' : 'Not generated yet'}
            </div>
          )}
          <label className="text-xs text-[#94a3b8] block">
            QBO invoice #
            <input
              type="text"
              inputMode="numeric"
              value={balanceQboInvoiceNumber}
              onChange={(e) => setBalanceQboInvoiceNumber(e.target.value)}
              placeholder="1003"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-[#f1f5f9] placeholder:text-[#64748b]"
            />
          </label>
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleGeneratePdf('balance')}
              disabled={!canGenerateBalancePdf}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-40"
            >
              {generatingBalancePdf ? 'Generating…' : 'Download remittance PDF'}
            </button>
            <button
              type="button"
              onClick={() => openPaymentEmailDraft('balance')}
              disabled={!canGenerateBalancePdf}
              className="w-full px-4 py-2 text-sm font-medium rounded-full border border-sky-400/50 text-sky-100 hover:bg-sky-900/25 disabled:opacity-40"
            >
              Open email draft (Outlook)
            </button>
            <button
              type="button"
              onClick={() => handleCopyQboDraft('balance')}
              disabled={!canGenerateBalancePdf}
              className="w-full px-4 py-2 text-xs rounded-full border border-sky-400/40 text-sky-200 hover:bg-sky-900/20 disabled:opacity-40"
            >
              Copy QBO invoice draft
            </button>
          </div>
        </div>
        </>
        )}
      </div>

      {qboDraft && showAgreement && (
        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-xs font-mono text-[#94a3b8] whitespace-pre-wrap max-h-48 overflow-y-auto">
          {qboDraft}
        </div>
      )}

      {part === 'full' && (
      <ol className="text-xs text-[#64748b] list-decimal list-inside space-y-1">
        <li>NDA: pre-sign as Owner in SignWell, send to client — before proposal</li>
        <li>Send scope-only proposal (Phase 3)</li>
        <li>Retainer: pre-sign, send for signature — no card collection</li>
        <li>After retainer signed: send QBO invoice (card payments OFF) + remittance PDF</li>
        <li>Mark agreement & payment when activation funds arrive</li>
        <li>After delivery: QBO balance invoice + remittance PDF</li>
        <li>Grant portal access within {PORTAL_ACCESS_SLA} after agreement</li>
      </ol>
      )}
    </section>
  );
}
