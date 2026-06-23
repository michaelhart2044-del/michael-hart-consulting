import type { PrepSubmission } from '@/lib/submissions-store';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';
import { buildDocumentMergeFields } from '@/lib/documents/merge-fields';
import type { PandaDocClientDetails } from '@/lib/pandadoc/client-details';
import { PAYMENT_POLICY_SHORT } from '@/lib/documents/payment-policy';
import { site } from '@/lib/site';

export type QuickBooksInvoiceKind = 'activation' | 'balance';

export interface QuickBooksInvoiceDraft {
  kind: QuickBooksInvoiceKind;
  customerDisplayName: string;
  customerEmail: string;
  company: string;
  lineDescription: string;
  amount: number;
  amountFormatted: string;
  invoiceDate: string;
  dueDate: string;
  memo: string;
  customerNotes: string;
  /** Paste into QuickBooks — disable online card payments on the invoice. */
  paymentSettingsNote: string;
  copyBlock: string;
}

function invoiceKindLabel(kind: QuickBooksInvoiceKind): string {
  return kind === 'activation' ? 'Phase 1 Activation Retainer' : 'Phase 1 Final Balance';
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function buildQuickBooksInvoiceDraft(
  sub: PrepSubmission,
  kind: QuickBooksInvoiceKind,
  clientDetails: PandaDocClientDetails,
): QuickBooksInvoiceDraft | null {
  if (!sub.engagementQuote?.savedAt) return null;
  const fees = effectiveQuoteFees(sub.engagementQuote);
  const amount = kind === 'activation' ? fees.activationFee : fees.balanceDue;
  if (amount <= 0) return null;

  const fields = buildDocumentMergeFields(sub, clientDetails);
  const company = clientDetails.company.trim() || fields.recipientCompany;
  const today = new Date();
  const due = kind === 'activation' ? today : addDays(today, 14);
  const label = invoiceKindLabel(kind);

  const memo =
    `${label} — ${company}. ${PAYMENT_POLICY_SHORT} Reference client: ${sub.name} (${sub.email}).`;

  const customerNotes =
    `${PAYMENT_POLICY_SHORT}\n\n` +
    `Pay by ACH, wire, or check. Wire/ACH details are on the remittance instruction PDF from Michael Hart.\n\n` +
    `Questions: ${site.phone} or ${site.email}`;

  const paymentSettingsNote =
    'In QuickBooks: turn OFF "Credit card" and "Bank transfer" online payment options for this invoice. ' +
    'Send the client your remittance instruction PDF (ACH/wire/check only). Mark paid manually in admin when funds arrive.';

  const copyBlock = [
    '--- QuickBooks invoice draft (ACH / wire / check only) ---',
    `Customer: ${sub.name}`,
    `Company: ${company}`,
    `Email: ${sub.email}`,
    `Invoice date: ${formatDate(today)}`,
    `Due date: ${formatDate(due)}`,
    `Line item: ${label}`,
    `Amount: ${formatUsd(amount)}`,
    `Memo (internal): ${memo}`,
    `Message on invoice: ${customerNotes.replace(/\n/g, ' ')}`,
    paymentSettingsNote,
    '---',
  ].join('\n');

  return {
    kind,
    customerDisplayName: sub.name,
    customerEmail: sub.email,
    company,
    lineDescription: label,
    amount,
    amountFormatted: formatUsd(amount),
    invoiceDate: formatDate(today),
    dueDate: formatDate(due),
    memo,
    customerNotes,
    paymentSettingsNote,
    copyBlock,
  };
}

export function getQuickBooksConfigStatus(): { configured: boolean; missing: string[] } {
  // Full QBO OAuth is optional — drafts work without API credentials.
  const hasOAuth =
    !!process.env.QBO_CLIENT_ID?.trim() &&
    !!process.env.QBO_CLIENT_SECRET?.trim() &&
    !!process.env.QBO_REALM_ID?.trim() &&
    !!process.env.QBO_REFRESH_TOKEN?.trim();
  if (hasOAuth) return { configured: true, missing: [] };
  return {
    configured: false,
    missing: ['QBO_CLIENT_ID', 'QBO_CLIENT_SECRET', 'QBO_REALM_ID', 'QBO_REFRESH_TOKEN'],
  };
}
