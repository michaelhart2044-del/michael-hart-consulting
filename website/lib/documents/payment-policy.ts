import { site } from '@/lib/site';

/** Firm policy: ACH, wire, or check only — no card processing. */
export const PAYMENT_METHODS_ACCEPTED = ['ACH bank transfer', 'Wire transfer', 'Check'] as const;

export const PAYMENT_POLICY_SHORT =
  'Payment by ACH, wire, or check only. We do not accept credit or debit cards.';

export const PAYMENT_POLICY_CLIENT_PARAGRAPH =
  'All fees are payable by ACH bank transfer, domestic wire, or check payable to Michael Hart Consulting Group LLC. ' +
  'We do not accept credit or debit card payments. Payment is due as stated on each invoice or remittance instruction.';

export interface PaymentInstructionsConfig {
  configured: boolean;
  missing: string[];
  bankName?: string;
  accountName?: string;
  routingNumber?: string;
  accountNumber?: string;
  remittanceEmail: string;
}

export function getPaymentInstructionsConfig(): PaymentInstructionsConfig {
  const missing: string[] = [];
  const bankName = process.env.MH_PAYMENT_BANK_NAME?.trim();
  const accountName = process.env.MH_PAYMENT_ACCOUNT_NAME?.trim() || site.legalName;
  const routingNumber = process.env.MH_PAYMENT_ROUTING_NUMBER?.trim();
  const accountNumber = process.env.MH_PAYMENT_ACCOUNT_NUMBER?.trim();
  const remittanceEmail = process.env.MH_PAYMENT_REMITTANCE_EMAIL?.trim() || site.email;

  if (!bankName) missing.push('MH_PAYMENT_BANK_NAME');
  if (!routingNumber) missing.push('MH_PAYMENT_ROUTING_NUMBER');
  if (!accountNumber) missing.push('MH_PAYMENT_ACCOUNT_NUMBER');

  return {
    configured: missing.length === 0,
    missing,
    bankName,
    accountName,
    routingNumber,
    accountNumber,
    remittanceEmail,
  };
}
