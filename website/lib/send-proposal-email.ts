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
}): Promise<{ success: true } | { success: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY is not configured.' };
  }

  const { clientEmail, clientName, proposalText } = params;
  const greeting = clientName.split(' ')[0] || 'there';
  const subject = `Initial Proposal — ${clientName}`;
  const filename = `Proposal — ${safeFilename(clientName)}.pdf`;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateProposalPdfBuffer({ clientName, proposalText });
  } catch (error) {
    console.error('Proposal PDF generation failed:', error);
    return { success: false, error: 'Failed to generate proposal PDF.' };
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: getResendFrom('Michael Hart Consulting'),
      to: clientEmail,
      bcc: site.email,
      replyTo: site.email,
      subject,
      html: buildProposalEmailHtml(greeting),
      attachments: [
        {
          filename,
          content: pdfBuffer.toString('base64'),
        },
      ],
    });
    return { success: true };
  } catch (error) {
    console.error('Proposal email failed:', error);
    return { success: false, error: 'Failed to send proposal email. Check Resend logs and try again.' };
  }
}
