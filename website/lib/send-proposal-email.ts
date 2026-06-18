/**
 * Send initial proposal to client via Resend (server-only).
 */

import { Resend } from 'resend';
import { site } from '@/lib/site';
import { getResendFrom } from '@/lib/resend-email';
import { generateProposalPdfBuffer } from '@/lib/proposal-pdf';

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 80) || 'client';
}

export function buildProposalEmailHtml(greeting: string): string {
  return `
    <p>Hi ${escapeHtml(greeting)},</p>
    <p>Thank you for our conversation. I've attached the initial proposal outlining our recommended path forward based on what you shared.</p>
    <p>Please review at your convenience and let me know if you have any questions — or if you'd like to schedule a brief follow-up to walk through scope and timing together.</p>
    <p>Best regards,<br />Michael Hart<br />${escapeHtml(site.name)}<br />${escapeHtml(site.phone)}</p>
  `;
}

export async function sendProposalEmailToClient(params: {
  clientEmail: string;
  clientName: string;
  proposalText: string;
}): Promise<{ success: true; resendId: string } | { success: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY is not configured in Vercel.' };
  }

  const { clientEmail, clientName, proposalText } = params;
  const greeting = clientName.split(' ')[0] || 'there';
  const subject = `Initial Proposal — ${clientName}`;
  const filename = `Proposal - ${safeFilename(clientName)}.pdf`;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateProposalPdfBuffer({ clientName, proposalText });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Proposal PDF generation failed:', error);
    return { success: false, error: `Failed to generate proposal PDF: ${detail}` };
  }

  if (!pdfBuffer?.length) {
    return { success: false, error: 'Proposal PDF was empty.' };
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: getResendFrom('Michael Hart Consulting'),
    to: clientEmail,
    cc: site.email,
    replyTo: site.email,
    subject,
    html: buildProposalEmailHtml(greeting),
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  if (error) {
    console.error('Proposal email rejected by Resend:', error);
    return {
      success: false,
      error: error.message || 'Resend rejected the email. Check the Resend dashboard for details.',
    };
  }

  if (!data?.id) {
    return { success: false, error: 'Resend did not return a message id — email may not have sent.' };
  }

  return { success: true, resendId: data.id };
}
