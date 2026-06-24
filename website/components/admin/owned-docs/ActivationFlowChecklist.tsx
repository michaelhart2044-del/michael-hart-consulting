'use client';

import type { PrepSubmission } from '@/lib/submissions-store';
import { isOwnedSignWellDocComplete } from '@/lib/signwell/owned-doc-status';

interface Props {
  submission: PrepSubmission;
}

type StepStatus = 'complete' | 'active' | 'upcoming';

function stepClass(status: StepStatus): string {
  if (status === 'complete') return 'text-emerald-300';
  if (status === 'active') return 'text-[#e8d5b5]';
  return 'text-[#64748b]';
}

function marker(status: StepStatus): string {
  if (status === 'complete') return '✓';
  if (status === 'active') return '→';
  return '○';
}

export default function ActivationFlowChecklist({ submission }: Props) {
  const hasPricing = !!submission.engagementQuote?.savedAt;
  const retainer = submission.ownedDocuments?.retainer;
  const retainerSigned = !!retainer && isOwnedSignWellDocComplete(retainer);
  const remittanceSent = !!submission.ownedDocuments?.activationPayment;
  const agreementMarked = !!submission.engagementCommittedAt;
  const portalGranted = !!submission.portalAccessGrantedAt && !submission.portalRevokedAt;

  const steps: { label: string; detail: string; status: StepStatus }[] = [
    {
      label: 'Pricing saved',
      detail: 'Engagement Economics quote on dossier',
      status: hasPricing ? 'complete' : 'active',
    },
    {
      label: 'Retainer in SignWell',
      detail: 'Generate → pre-sign as Owner → send to client (sign only, no payment in SignWell)',
      status: !hasPricing ? 'upcoming' : retainer || agreementMarked ? 'complete' : 'active',
    },
    {
      label: 'Retainer fully signed',
      detail: 'Webhook updates status — use Refresh status if needed',
      status:
        !hasPricing ? 'upcoming'
        : retainerSigned || agreementMarked ? 'complete'
        : retainer ? 'active'
        : 'upcoming',
    },
    {
      label: 'Invoice + remittance sent',
      detail: 'QBO Plus invoice (cards OFF) + Download remittance PDF — email both to client',
      status:
        !retainerSigned && !agreementMarked ? 'upcoming'
        : remittanceSent ? 'complete'
        : retainerSigned || agreementMarked ? 'active'
        : 'upcoming',
    },
    {
      label: 'Agreement marked paid',
      detail: 'Phase 5 Portal section — when activation funds arrive',
      status: agreementMarked ? 'complete' : retainerSigned ? 'active' : 'upcoming',
    },
    {
      label: 'Portal access granted',
      detail: 'Within 48 hours of payment — client completes prep + books 1-hr meeting',
      status: !agreementMarked ? 'upcoming' : portalGranted ? 'complete' : 'active',
    },
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-[#64748b]">
        Activation flow — SignWell + QBO Plus
      </div>
      <ol className="text-xs space-y-1.5 list-none">
        {steps.map((step) => (
          <li key={step.label} className={stepClass(step.status)}>
            <span className="font-medium">
              {marker(step.status)} {step.label}
            </span>
            <span className="block text-[#64748b] ml-4">{step.detail}</span>
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-[#64748b] pt-1 border-t border-white/10">
        <span className="text-[#94a3b8]">QBO Plus:</span> use for customer records and invoices only — turn off
        online card/bank pay. SignWell handles signatures; remittance PDF has ACH/wire/check details.
      </p>
    </div>
  );
}
