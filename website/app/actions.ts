'use server';

import { Resend } from 'resend';
import { site } from '@/lib/site';
import { analysisQuestions } from '@/lib/analysis-questions';

// Escape user input to prevent HTML injection when interpolating into the email body.
// Always sanitize untrusted data (name, email, message) coming from the contact form.
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendContactEmail(formData: FormData) {
  // Honeypot check for spam bots (field should be empty for humans)
  const honeypot = formData.get('company_website') as string;
  if (honeypot && honeypot.trim() !== '') {
    // Pretend success for bots
    return { success: true };
  }

  const rawName = (formData.get('name') as string) || '';
  const rawEmail = (formData.get('email') as string) || '';
  const rawMessage = (formData.get('message') as string) || '';

  // Basic server-side validation
  if (!rawName.trim() || rawName.trim().length < 2) {
    return { success: false, error: 'Please provide your full name.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!rawEmail.trim() || !emailRegex.test(rawEmail.trim())) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  if (!rawMessage.trim() || rawMessage.trim().length < 10) {
    return { success: false, error: 'Please provide a more detailed message (at least 10 characters).' };
  }

  // Optional basic spam pattern filter
  const combined = (rawName + ' ' + rawEmail + ' ' + rawMessage).toLowerCase();
  const spamPatterns = /viagra|casino|lottery|free money|click here|buy now|earn cash/i;
  if (spamPatterns.test(combined)) {
    // Silent success for obvious spam
    return { success: true };
  }

  // Sanitize all user-provided values before using them anywhere in the email
  const name = escapeHtml(rawName.trim());
  const email = escapeHtml(rawEmail.trim());
  const message = escapeHtml(rawMessage.trim()).replace(/\n/g, '<br>');

  // Create Resend instance inside the function (best practice)
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Send notification to owner
    await resend.emails.send({
      // Production sender using the site's own domain.
      // The domain (michaelhartconsulting.com) must be verified in the Resend dashboard.
      // "onboarding@resend.dev" is only a sandbox address for development/testing.
      from: `Contact Form <${site.email}>`,
      to: site.email,
      subject: `New message from ${rawName.trim().slice(0, 80) || 'website visitor'}`,
      replyTo: rawEmail,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    // Send professional auto-reply to the submitter (independently, so failure doesn't affect owner notification)
    try {
      await resend.emails.send({
        from: `${site.name} <${site.email}>`,
        to: rawEmail,
        subject: `Thank you for contacting ${site.name}`,
        html: `
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to ${site.name}. We have received your message and will get back to you within 24 business hours.</p>
          <p>In the meantime, you can reach us directly at ${site.phone}.</p>
          <p>Best regards,<br />${site.name}</p>
          <p><small>Please check your spam folder if you don't see our confirmation email.</small></p>
        `,
      });
    } catch (autoReplyError) {
      console.error('Auto-reply email failed (owner notification succeeded):', autoReplyError);
      // Do not fail the overall request; owner notification was sent.
    }

    return { success: true };
  } catch (error) {
    console.error('Resend error:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

/**
 * Server action for the AI-Powered Process Analysis prep form (/prepare-analysis).
 * Collects structured discovery answers, sends a clean formatted email to Michael
 * (and a confirmation copy to the client). Reuses the same Resend + sanitize + honeypot
 * patterns as the contact form for consistency and safety.
 *
 * These answers are the primary input that later powers internal proposal generation
 * (SigVai - private, Michael-only). Never exposed publicly.
 */
export async function sendAnalysisPrep(formData: FormData) {
  // Honeypot (same field name as contact form for shared bot protection logic)
  const honeypot = formData.get('company_website') as string;
  if (honeypot && honeypot.trim() !== '') {
    return { success: true };
  }

  const rawName = (formData.get('name') as string) || '';
  const rawEmail = (formData.get('email') as string) || '';
  const company = (formData.get('company') as string) || '';
  const role = (formData.get('role') as string) || '';

  // Minimal validation
  if (!rawName.trim() || rawName.trim().length < 2) {
    return { success: false, error: 'Please provide your full name.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!rawEmail.trim() || !emailRegex.test(rawEmail.trim())) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  // Collect answers using the canonical question ids (defensive - only known keys)
  const answers: Record<string, string> = {};
  for (const q of analysisQuestions) {
    const val = (formData.get(q.id) as string) || '';
    if (val.trim()) {
      answers[q.id] = val.trim();
    }
  }

  // If literally nothing provided beyond name/email, still allow (they just wanted the link)
  // but we still send a minimal record.

  // Sanitize
  const name = escapeHtml(rawName.trim());
  const email = escapeHtml(rawEmail.trim());
  const safeCompany = escapeHtml(company.trim());
  const safeRole = escapeHtml(role.trim());

  // Build a nicely structured HTML body for Michael (easy to forward into SigVai)
  const answersHtml = analysisQuestions
    .map((q) => {
      const a = answers[q.id] ? escapeHtml(answers[q.id]).replace(/\n/g, '<br>') : '<em>(not answered)</em>';
      return `<p style="margin: 12px 0 4px;"><strong>${q.number}. ${escapeHtml(q.label)}</strong><br>${a}</p>`;
    })
    .join('');

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: `Process Analysis Prep <${site.email}>`,
      to: site.email,
      subject: `AI-Powered Process Analysis Prep — ${rawName.trim().slice(0, 60)}`,
      replyTo: rawEmail,
      html: `
        <p><strong>From:</strong> ${name} ${safeRole ? `(${safeRole})` : ''}</p>
        ${safeCompany ? `<p><strong>Company:</strong> ${safeCompany}</p>` : ''}
        <p><strong>Email:</strong> ${email}</p>

        <hr style="margin:16px 0;border:none;border-top:1px solid #ddd" />

        <h3 style="margin:0 0 8px;">Discovery Answers</h3>
        ${answersHtml}

        <p style="margin-top:20px;font-size:12px;color:#666;">Submitted via the public prep form on ${site.name}.</p>
      `,
    });

    // Auto-reply to the client (independent)
    try {
      const answeredCount = Object.keys(answers).length;
      await resend.emails.send({
        from: `${site.name} <${site.email}>`,
        to: rawEmail,
        subject: `Your AI-Powered Process Analysis prep answers (copy)`,
        html: `
          <p>Dear ${name},</p>
          <p>Thank you — we received your responses for the 30-min AI-Powered Process Analysis. Michael has them and will review before your call.</p>
          ${answeredCount > 0 ? `<p>You answered ${answeredCount} of the discovery questions. A clean copy is below for your records.</p>` : ''}

          <hr style="margin:16px 0;border:none;border-top:1px solid #ddd" />

          <h3 style="margin:0 0 8px;">Your answers</h3>
          ${answersHtml}

          <p style="margin-top:16px;">Ready to book (or add more context)? Use this link:<br>
          <a href="${site.calendlyUrl}">${site.calendlyUrl}</a></p>

          <p>Feel free to reply to this email with anything else before the call.</p>

          <p>Best regards,<br />${site.name}<br />${site.phone}</p>
        `,
      });
    } catch (autoReplyError) {
      console.error('Analysis prep auto-reply failed (owner notification succeeded):', autoReplyError);
    }

    return { success: true };
  } catch (error) {
    console.error('Resend error (analysis prep):', error);
    return { success: false, error: 'Failed to send your answers. Please try again or email us directly.' };
  }
}
