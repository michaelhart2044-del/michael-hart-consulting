import type { PrepSubmission } from '@/lib/submissions-store';
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

function openingLine(
  label: string,
  amount: string,
  invoiceRef?: string,
): string {
  if (invoiceRef) {
    return `Attached are Invoice #${invoiceRef} and remittance instructions for the ${label} (${amount}).`;
  }
  return `Attached are your invoice and remittance instructions for the ${label} (${amount}).`;
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
  const amount = draft.amountFormatted;
  const invoiceRef = qboInvoiceNumber?.trim() || undefined;
  const memoRef = invoiceRef || draft.company;

  const subject = invoiceRef
    ? `${site.name} — Invoice #${invoiceRef} & Payment Instructions`
    : `${site.name} — ${label} & Payment Instructions`;

  const body = [
    `Hi ${greeting},`,
    '',
    openingLine(label, amount, invoiceRef),
    '',
    `${PAYMENT_POLICY_SHORT} Bank details are on the remittance instruction PDF.`,
    '',
    `Please include reference "${memoRef}" with your payment so we can match it promptly.`,
    '',
    'Thank you for moving forward with us — we appreciate your trust and look forward to working together.',
    '',
    'When payment is sent, a quick reply to this email is helpful. If anything is unclear, just ask.',
  ].join('\n');

  return {
    to: sub.email,
    subject,
    body,
    attachmentHint: 'Attach QBO invoice PDF + remittance instruction PDF, then send.',
  };
}
