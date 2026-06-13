'use server';

import { Resend } from 'resend';
import { site } from '@/lib/site';

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
 * Server action for the optional prep form on /prepare-analysis.
 * Collects the simplified intake fields and emails them to Michael (plus confirmation to client).
 * Reuses the exact same Resend + honeypot + sanitize patterns as the contact form.
 */
export async function sendAnalysisPrep(formData: FormData) {
  // Honeypot (same field name as contact form)
  const honeypot = formData.get('company_website') as string;
  if (honeypot && honeypot.trim() !== '') {
    return { success: true };
  }

  const rawName = (formData.get('name') as string) || '';
  const rawEmail = (formData.get('email') as string) || '';
  const industry = (formData.get('industry') as string) || '';
  const mainChallenge = (formData.get('main_challenge') as string) || '';
  const mainChallengeOther = (formData.get('main_challenge_other') as string) || '';
  const peopleInvolved = (formData.get('people_involved') as string) || '';
  const successLooksLike = (formData.get('success_looks_like') as string) || '';
  const additionalContext = (formData.get('additional_context') as string) || '';
  const additionalChallengesList = formData.getAll('additional_challenge')
    .map((v) => String(v).trim())
    .filter(Boolean);

  if (!rawName.trim() || rawName.trim().length < 2) {
    return { success: false, error: 'Please provide your full name.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!rawEmail.trim() || !emailRegex.test(rawEmail.trim())) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  const name = escapeHtml(rawName.trim());
  const email = escapeHtml(rawEmail.trim());
  const safeIndustry = escapeHtml(industry);
  let challengeDisplay = escapeHtml(mainChallenge);
  if (mainChallenge === 'Other' && mainChallengeOther.trim()) {
    challengeDisplay += ` — ${escapeHtml(mainChallengeOther)}`;
  }
  const safePeople = escapeHtml(peopleInvolved);
  const safeSuccess = escapeHtml(successLooksLike).replace(/\n/g, '<br>');
  const safeContext = escapeHtml(additionalContext).replace(/\n/g, '<br>');

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: `Consultation Prep <${site.email}>`,
      to: site.email,
      subject: `Initial Consultation Prep — ${rawName.trim().slice(0, 60)}`,
      replyTo: rawEmail,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Industry / Business Type:</strong> ${safeIndustry || 'Not specified'}</p>
        <p><strong>Main Challenge:</strong> ${challengeDisplay || 'Not specified'}</p>
        ${additionalChallengesList.length > 0 ? `
          <p><strong>Additional challenges:</strong></p>
          <ul style="margin:4px 0 12px 16px; padding:0; list-style:none;">
            ${additionalChallengesList.map((c: string) => `<li style="margin:2px 0;">• ${escapeHtml(c)}</li>`).join('')}
          </ul>
        ` : ''}
        <p><strong>People involved in month-end / reporting:</strong> ${safePeople || 'Not specified'}</p>
        <p><strong>What success looks like (30–90 days):</strong><br>${safeSuccess || '<em>Not specified</em>'}</p>
        ${safeContext ? `<p><strong>Deadlines, stakeholders or upcoming changes:</strong><br>${safeContext}</p>` : ''}
        <p style="margin-top:16px;font-size:12px;color:#666;">Submitted via the prep form on ${site.name}.</p>
      `,
    });

    // Auto-reply (independent)
    try {
      await resend.emails.send({
        from: `${site.name} <${site.email}>`,
        to: rawEmail,
        subject: `Thank you — details for your initial consultation`,
        html: `
          <p>Dear ${name},</p>
          <p>Thank you — we received your details for the initial consultation. Michael has them and will review before your call.</p>
          <p>Ready to book? <a href="${site.calendlyUrl}">${site.calendlyUrl}</a></p>
          <p>Best regards,<br />${site.name}<br />${site.phone}</p>
        `,
      });
    } catch (autoReplyError) {
      console.error('Prep auto-reply failed (owner notification succeeded):', autoReplyError);
    }

    return { success: true };
  } catch (error) {
    console.error('Resend error (prep):', error);
    return { success: false, error: 'Failed to send your details. Please try again or email us directly.' };
  }
}
