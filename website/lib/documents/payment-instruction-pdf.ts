/**
 * Branded remittance instruction PDF — ACH / wire / check only (no card links).
 */

import { promises as fs } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { colors } from '@/lib/brand-tokens';
import { site } from '@/lib/site';
import { formatUsd } from '@/lib/engagement-pricing';
import { PAYMENT_POLICY_CLIENT_PARAGRAPH, getPaymentInstructionsConfig } from '@/lib/documents/payment-policy';
import type { DocumentMergeFields } from '@/lib/documents/merge-fields';
import { contractorProfile } from '@/lib/pandadoc/contractor';

const NAVY = colors.background;
const GOLD = colors.accent;
const MUTED = colors.subtle;
const BODY = '#1e293b';

export type PaymentInstructionKind = 'activation' | 'balance';

export interface PaymentInstructionParams {
  kind: PaymentInstructionKind;
  fields: DocumentMergeFields;
  amount: number;
  invoiceReference?: string;
}

function kindLabel(kind: PaymentInstructionKind): string {
  return kind === 'activation' ? 'Phase 1 Activation Retainer' : 'Phase 1 Final Balance';
}

export async function generatePaymentInstructionPdfBuffer(
  params: PaymentInstructionParams,
): Promise<Buffer> {
  const { kind, fields, amount, invoiceReference } = params;
  const pay = getPaymentInstructionsConfig();
  const logo = await fs.readFile(path.join(process.cwd(), 'public', 'mh-logo.png'));
  const title = kindLabel(kind);
  const ref = invoiceReference || `${kind.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 54, bottom: 54, left: 54, right: 54 },
      info: {
        Title: `${title} — Payment Instructions — ${fields.recipientCompany}`,
        Author: site.name,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const width = doc.page.width - left - doc.page.margins.right;

    doc.image(logo, left, 48, { width: 48, height: 48 });
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(NAVY)
      .text('Payment Instructions', left + 58, 52);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(MUTED)
      .text(site.name, left + 58, 74);

    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(GOLD).text(title, { width });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).fillColor(BODY);
    doc.text(`Bill to: ${fields.recipientFirstName} ${fields.recipientLastName}`.trim(), { width });
    doc.text(`Company: ${fields.recipientCompany}`, { width });
    doc.text(`Reference: ${ref}`, { width });
    doc.text(`Amount due: ${formatUsd(amount)}`, { width });
    doc.text(`Date: ${fields.agreementDate}`, { width });

    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text('Payment policy', { width });
    doc.font('Helvetica').fontSize(10).fillColor(BODY).text(PAYMENT_POLICY_CLIENT_PARAGRAPH, {
      width,
      lineGap: 3,
    });

    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text('How to pay', { width });

    if (pay.configured) {
      doc.font('Helvetica').fontSize(10).fillColor(BODY);
      doc.text('ACH bank transfer', { underline: true });
      doc.text(`Bank: ${pay.bankName}`, { lineGap: 2 });
      doc.text(`Account name: ${pay.accountName}`);
      doc.text(`Routing number: ${pay.routingNumber}`);
      doc.text(`Account number: ${pay.accountNumber}`);
      doc.moveDown(0.5);
      doc.text('Wire transfer', { underline: true });
      doc.text('Use the same bank details above. Include the reference number in the wire memo.', {
        lineGap: 2,
      });
      doc.moveDown(0.5);
      doc.text('Check', { underline: true });
      doc.text(`Payable to: ${pay.accountName}`, { lineGap: 2 });
      doc.text(`Mail to: ${contractorMailingLine()}`);
    } else {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(BODY)
        .text(
          'Bank details are configured in your deployment environment. Contact Michael Hart for wire/ACH instructions.',
          { width, lineGap: 3 },
        );
    }

    doc.moveDown(1);
    doc.font('Helvetica').fontSize(10).fillColor(MUTED);
    doc.text(
      `After payment, email confirmation to ${pay.remittanceEmail} with the reference number above.`,
      { width, lineGap: 2 },
    );
    doc.text(`${site.phone}  •  ${site.email}  •  ${site.url.replace(/^https?:\/\//, '')}`, {
      width,
    });

    doc.end();
  });
}

function contractorMailingLine(): string {
  const p = contractorProfile;
  return `${p.streetAddress}, ${p.city}, ${p.state} ${p.postalCode}`;
}
