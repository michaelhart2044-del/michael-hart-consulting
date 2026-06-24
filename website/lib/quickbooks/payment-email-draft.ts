import type { PrepSubmission } from '@/lib/submissions-store';
import { formatUsd } from '@/lib/engagement-pricing';
import { PAYMENT_POLICY_SHORT } from '@/lib/documents/payment-policy';
import { site } from '@/lib/site';
import {
  buildQuickBooksInvoiceDraft,
  type QuickBooksInvoiceKind,
} from '@/lib/quickbooks/invoice-draft';
import type { PandaDocClientDetails } from '@/lib/pandadoc/client-details';

export interface PaymentPackageEmailDraft {
  to: string;
  subject: string;
  body: string;
  attachmentHint: string;
}

function invoiceLabel(kind: QuickBooksInvoiceKind): string {
  return kind === 'activation' ? 'Phase 1 Activation Retainer' : 'Phase 1 Final Balance';
}

/** Plain-text body + subject for Outlook mailto (attach QBO invoice PDF + remittance PDF manually). */
export function buildPaymentPackageEmailDraft(
  sub: PrepSubmission,
  kind: QuickBooksInvoiceKind,
  clientDetails: PandaDocClientDetails,
  qboInvoiceNumber?: string,
): PaymentPackageEmailDraft | null {
  const draft = buildQuickBooksInvoiceDraft(sub, kind, clientDetails);
  if (!draft) return null;

  const greeting = sub.name.split(' ')[0] || 'there';
  const label = invoiceLabel(kind);
  const company = draft.company;
  const amount = draft.amountFormatted;
  const invoiceRef = qboInvoiceNumber?.trim();
  const invoicePhrase = invoiceRef ? `Invoice #${invoiceRef}` : 'the attached invoice';

  const subject = invoiceRef
    ? `${site.name} — Invoice #${invoiceRef} & Payment Instructions`
    : `${site.name} — ${label} & Payment Instructions`;

  const memoRef = invoiceRef || company;

  const body = [
    `Hi ${greeting},`,
    '',
    `Please find attached ${invoicePhrase} for the ${label} (${amount}).`,
    '',
    `${PAYMENT_POLICY_SHORT} Bank details are on the attached remittance instruction PDF.`,
    '',
    `Please include reference "${memoRef}" with your payment so we can match it promptly.`,
    '',
    'Attachments to include before sending:',
    `1. QuickBooks invoice PDF${invoiceRef ? ` (#${invoiceRef})` : ''}`,
    '2. MH remittance instruction PDF',
    '',
    'Let me know when payment is sent or if you have any questions.',
    '',
    'Best,',
    'Michael Hart',
    site.name,
    site.phone,
    site.email,
  ].join('\n');

  return {
    to: sub.email,
    subject,
    body,
    attachmentHint: 'Attach QBO invoice PDF + remittance PDF, then send.',
  };
}
