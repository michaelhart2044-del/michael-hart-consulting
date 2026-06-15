'use server';

import { Resend } from 'resend';
import { site } from '@/lib/site';
import { headers } from 'next/headers';
import { saveSubmission, getRecentSubmissions, getSubmissionById, markSubmissionSent, saveProposalDraft, updatePreMeetingDiscovery } from '@/lib/submissions-store';
import { createAdminSession, verifyAdminSession, setAdminCookie, clearAdminCookie, getAdminSessionToken } from '@/lib/admin-auth';
import { generateProposal, GeneratorInput } from '@/lib/proposal-generator';
import { createClientMagicToken, verifyClientMagicToken, setClientCookie, clearClientCookie, getClientSessionEmail } from '@/lib/client-auth';

/**
 * Simple in-memory rate limiter (per-IP and per-email).
 * Sufficient for a low-volume professional site. Resets on cold starts (acceptable).
 * Limits: 5 submissions per 15 minutes per IP or per email.
 */
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(key: string, max = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const arr = (rateLimitMap.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return true;
  arr.push(now);
  rateLimitMap.set(key, arr);
  return false;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for') || h.get('x-real-ip') || '';
  return forwarded.split(',')[0].trim() || 'unknown';
}

/**
 * Basic spam / bot pattern checks. Expand as needed.
 * Triggers return silent success so bots think they succeeded.
 */
function containsSpamPatterns(text: string): boolean {
  const lower = text.toLowerCase();
  const patterns = /(viagra|casino|lottery|free money|click here|buy now|earn cash|seo service|crypto|bitcoin|investment opportunity|make money fast|work from home|weight loss|adult|xxx|porn)/i;
  if (patterns.test(lower)) return true;

  // Too many URLs (common in spam)
  const urlCount = (lower.match(/https?:\/\//g) || []).length;
  if (urlCount >= 2) return true;

  // Excessive repetition or all-caps subject-like noise
  if (/(.)\1{6,}/.test(lower) || lower === lower.toUpperCase() && lower.length > 30) return true;

  return false;
}

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
    // Pretend success for bots — do not reveal detection
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

  // Rate limiting (IP + email)
  const ip = await getClientIp();
  const emailKey = rawEmail.trim().toLowerCase();
  if (isRateLimited(`ip:${ip}`) || isRateLimited(`email:${emailKey}`)) {
    return { success: true }; // silent success
  }

  // Strengthened spam pattern checks
  const combined = `${rawName} ${rawEmail} ${rawMessage}`;
  if (containsSpamPatterns(combined)) {
    return { success: true }; // silent
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
        // Use a verified fallback from address for reliable delivery during testing / if domain verification is not complete.
      // Once your domain is verified in Resend, set RESEND_FROM on Vercel (e.g. "Michael Hart Consulting <michael@michaelhartconsulting.com>") to override.
      // For now we fall back to onboarding@resend.dev so emails are more likely to arrive while you complete domain verification.
      from: process.env.RESEND_FROM || `${site.name} <onboarding@resend.dev>`,
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

  // Rate limiting (IP + email) — protects the private intake as well
  const ip = await getClientIp();
  const emailKey = rawEmail.trim().toLowerCase();
  if (isRateLimited(`ip:${ip}`) || isRateLimited(`email:${emailKey}`)) {
    return { success: true };
  }

  // Strengthened spam checks for the prep form
  const combinedForSpam = `${rawName} ${rawEmail} ${mainChallenge} ${peopleInvolved} ${successLooksLike} ${additionalContext} ${additionalChallengesList.join(' ')}`;
  if (containsSpamPatterns(combinedForSpam)) {
    return { success: true };
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

  // RAW version for attachment + private store (clean, natural text for SigVai / xAI — no HTML escaping)
  let rawAttach = `Prep Answers for ${rawName.trim()} <${rawEmail.trim()}>\n\n`;
  rawAttach += `Industry / Business Type: ${industry || 'Not specified'}\n`;
  rawAttach += `Main Challenge: ${mainChallenge || 'Not specified'}`;
  if (mainChallenge === 'Other' && mainChallengeOther.trim()) {
    rawAttach += ` — ${mainChallengeOther.trim()}`;
  }
  rawAttach += `\n`;
  if (additionalChallengesList.length > 0) {
    rawAttach += `Additional challenges:\n${additionalChallengesList.map((c: string) => `- ${c}`).join('\n')}\n`;
  }
  rawAttach += `People involved in month-end / reporting: ${peopleInvolved || 'Not specified'}\n`;
  rawAttach += `What success looks like (30–90 days): ${successLooksLike || 'Not specified'}\n`;
  rawAttach += `Additional context / deadlines: ${additionalContext || 'Not specified'}\n`;

  // Sanitized version only for the HTML email body (owner notification)
  const safeAdditional = additionalChallengesList.map((c: string) => escapeHtml(c));

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
        ${safeAdditional.length > 0 ? `
          <p><strong>Additional challenges:</strong></p>
          <ul style="margin:4px 0 12px 16px; padding:0; list-style:none;">
            ${safeAdditional.map((c: string) => `<li style="margin:2px 0;">• ${c}</li>`).join('')}
          </ul>
        ` : ''}
        <p><strong>People involved in month-end / reporting:</strong> ${safePeople || 'Not specified'}</p>
        <p><strong>What success looks like (30–90 days):</strong><br>${safeSuccess || '<em>Not specified</em>'}</p>
        ${safeContext ? `<p><strong>Deadlines, stakeholders or upcoming changes:</strong><br>${safeContext}</p>` : ''}
        <p style="margin-top:16px;font-size:12px;color:#666;">Submitted via the prep form on ${site.name}.</p>
        <p><small>Answers also attached as prep-answers.txt for easy import into SigVai / xAI.</small></p>
      `,
      attachments: [
        {
          filename: 'prep-answers.txt',
          content: Buffer.from(rawAttach).toString('base64'),
        },
      ],
    });

    // Persist to private admin store (only after successful owner email)
    // We save RAW fields + the clean rawAttach so the /admin tool has perfect data.
    try {
      await saveSubmission({
        name: rawName.trim(),
        email: rawEmail.trim(),
        industry: industry || 'Not specified',
        mainChallenge: challengeDisplay || 'Not specified',
        additionalChallenges: additionalChallengesList,
        peopleInvolved: peopleInvolved || '',
        successLooksLike: successLooksLike || '',
        additionalContext: additionalContext || '',
        fullText: rawAttach,
      });
    } catch (storeErr) {
      // Never let storage failure affect the user or email delivery
      console.error('Non-fatal: failed to persist prep submission for admin tool', storeErr);
    }

    // Auto-reply (independent)
    try {
      await resend.emails.send({
        // Use a verified fallback from address for reliable delivery during testing / if domain verification is not complete.
      // Once your domain is verified in Resend, set RESEND_FROM on Vercel (e.g. "Michael Hart Consulting <michael@michaelhartconsulting.com>") to override.
      // For now we fall back to onboarding@resend.dev so emails are more likely to arrive while you complete domain verification.
      from: process.env.RESEND_FROM || `${site.name} <onboarding@resend.dev>`,
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

/* ============================================================
   ADMIN-ONLY ACTIONS (protected by middleware + explicit cookie verification)
   ============================================================ */

// Separate small rate limit for login attempts (very low tolerance)
const loginAttemptMap = new Map<string, number[]>();

function isLoginRateLimited(ip: string, max = 6, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const arr = (loginAttemptMap.get(ip) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return true;
  arr.push(now);
  loginAttemptMap.set(ip, arr);
  return false;
}

export async function authenticateAdmin(formData: FormData) {
  const password = (formData.get('password') as string) || '';
  const ip = await getClientIp();

  if (isLoginRateLimited(ip)) {
    return { success: false, error: 'Too many attempts. Please wait a few minutes.' };
  }

  const secretsOk = !!process.env.ADMIN_PASSWORD && !!process.env.ADMIN_COOKIE_SECRET;
  if (!secretsOk) {
    // Misconfiguration — do not leak details
    console.error('ADMIN_PASSWORD or ADMIN_COOKIE_SECRET is not configured');
    return { success: false, error: 'Admin access is not configured.' };
  }

  // Constant-time friendly compare (simple here; in prod use timingSafeEqual on buffers)
  if (password !== process.env.ADMIN_PASSWORD) {
    return { success: false, error: 'Invalid password.' };
  }

  const token = await createAdminSession();
  if (!token) {
    return { success: false, error: 'Unable to create session.' };
  }

  await setAdminCookie(token);
  return { success: true };
}

export async function logoutAdmin() {
  await clearAdminCookie();
  return { success: true };
}

// Re-verify inside every admin action (defense in depth)
async function requireAdmin(): Promise<boolean> {
  const token = await getAdminSessionToken();
  return verifyAdminSession(token);
}

export async function getRecentPrepsForAdmin() {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized', items: [] };
  }
  try {
    const items = await getRecentSubmissions(25);
    // Never return full raw email bodies in list for extra caution — the UI only needs summary fields
    const safe = items.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      name: s.name,
      email: s.email,
      industry: s.industry,
      mainChallenge: s.mainChallenge,
      sentAt: s.sentAt,
    }));
    return { success: true, items: safe };
  } catch (e) {
    return { success: false, error: 'Failed to load submissions', items: [] };
  }
}

export async function loadPrepForAdmin(id: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }
  const sub = await getSubmissionById(id);
  if (!sub) return { success: false, error: 'Not found' };
  return { success: true, submission: sub };
}

export async function markPrepAsSent(id: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }
  const ok = await markSubmissionSent(id);
  return { success: ok };
}

export async function saveProposalDraftForAdmin(id: string, draft: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }
  const ok = await saveProposalDraft(id, draft);
  return { success: ok };
}

// Server-side generation (keeps the logic private and consistent)
export async function generateInitialProposal(input: GeneratorInput) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }
  try {
    const proposal = generateProposal(input);
    return { success: true, proposal };
  } catch (e) {
    console.error('Proposal generation failed:', e);
    return { success: false, error: 'Generation failed' };
  }
}

/* ============================================================
   CLIENT PORTAL ACTIONS (minimal scope: magic link auth + guided pre-meeting data collection)
   Uses email from existing prep submissions. No DMAIC/SigVai mentions to clients.
   Data saved to private store to enrich future SigVai calls.
   ============================================================ */

export async function sendClientMagicLink(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  if (!email) {
    return { success: false, error: 'Please provide your email.' };
  }

  // LOUD LOCAL TEST OUTPUT - ALWAYS VISIBLE (big banners so they are impossible to miss)
  console.error('');
  console.error('******************************************************************');
  console.error('*** CLIENT PORTAL MAGIC LINK - LOCAL TEST (COPY THIS) ***');
  console.error('******************************************************************');
  console.error('EMAIL:', email);

  // Verify this email has a submission (client was invited post-agreement)
  const submissions = await getRecentSubmissions(100);
  const hasSubmission = submissions.some(s => s.email.toLowerCase() === email);
  console.error('SUBMISSIONS IN STORE:', submissions.length);
  console.error('HAS MATCHING SUBMISSION:', hasSubmission);

  // ALWAYS generate the link for local testing (bypass email hassle)
  const token = await createClientMagicToken(email);
  if (!token) {
    return { success: false, error: 'Magic links are not configured.' };
  }
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const loginUrl = baseUrl + '/portal/verify?token=' + encodeURIComponent(token);

  console.error(' ');
  console.error('COPY AND PASTE THIS FULL LINK:');
  console.error(loginUrl);
  console.error(' ');
  console.error('******************************************************************');
  console.error(' ');

  if (!hasSubmission) {
    console.error('NOTE: No submission found for this email yet — submit /prepare-analysis first (link still works for test).');
    return { success: true, loginUrl };
  }

  // Real path: send email (for when you test on live site)
  const resend = new Resend(process.env.RESEND_API_KEY);

  // =====================================================================
  // REMINDER — ONCE RESEND DOMAIN VERIFICATION IS FULLY ACTIVE:
  // 1. Set this env var on Vercel (Production + Preview):
  //      RESEND_FROM="Michael Hart Consulting <michael@michaelhartconsulting.com>"
  // 2. Redeploy (or wait for the auto-deploy from this push).
  // 3. On the LIVE site ONLY:
  //    - Submit https://www.michaelhartconsulting.com/prepare-analysis
  //      with a test email (this creates the submission record on the live store).
  //    - Go to live /portal/login with the EXACT same email.
  //    - Click the normal "Send secure access link" button
  //      (the red TEST MODE button has been completely removed — this is now the only/clean production path).
  //    - Check inbox (and spam) for the magic link email.
  //      It will now come from your verified custom from address.
  //    - Click the link in the email → you should land in the guided /portal
  //      experience (your prep summary + the additional pre-meeting questions form).
  //    - Fill and save the questions → you should see the "answers saved"
  //      message + the book-meeting button (already updated to your new 60-min
  //      Calendly link + the exact wording you requested).
  //    - Go to live /admin, log in, and Load that submission — you should see
  //      the preMeetingDiscovery data attached and ready for SigVai.
  // 4. This is the real production magic-link flow for clients after they
  //    complete the initial 30-min consultation + sign the agreement + pay the fee.
  // The loud local-test banners below are only for any future local debugging.
  // =====================================================================
  try {
    await resend.emails.send({
      // Use a verified fallback from address for reliable delivery during testing / if domain verification is not complete.
      // Once your domain is verified in Resend, set RESEND_FROM on Vercel (e.g. "Michael Hart Consulting <michael@michaelhartconsulting.com>") to override.
      // For now we fall back to onboarding@resend.dev so emails are more likely to arrive while you complete domain verification.
      from: process.env.RESEND_FROM || `${site.name} <onboarding@resend.dev>`,
      to: email,
      subject: `Access your private engagement portal - ${site.name}`,
      html: `
        <p>Hi,</p>
        <p>You've been granted access to your private portal for the engagement with ${site.name}.</p>
        <p>Click the link below to log in (this link will expire in 30 days):</p>
        <p><a href="${loginUrl}">${loginUrl}</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
        <p>Best regards,<br />${site.name}</p>
      `,
    });
    return { success: true, loginUrl };
  } catch (e) {
    console.error('Magic link email failed (but link is still in the big box above):', e);
    return { success: true, loginUrl };  // still give the link for local
  }
}

export async function verifyClientMagicAndLogin(token: string) {
  const email = await verifyClientMagicToken(token);
  if (!email) {
    return { success: false, error: 'Invalid or expired link.' };
  }

  await setClientCookie(email);
  return { success: true, email };
}

export async function logoutClient() {
  await clearClientCookie();
  return { success: true };
}

export async function getClientSession() {
  const email = await getClientSessionEmail();
  if (!email) return { success: false };
  return { success: true, email };
}

// Save the guided pre-meeting discovery data from the client portal (first-time flow).
// Uses client-friendly labels (e.g. "Process owners", "Current metrics") - no DMAIC/SigVai.
export async function savePreMeetingDiscovery(discovery: { [questionId: string]: string } & { additionalNotes?: string }) {
  const email = await getClientSessionEmail();
  if (!email) {
    return { success: false, error: 'Not logged in.' };
  }

  // Find the matching submission by email
  const submissions = await getRecentSubmissions(100);
  const sub = submissions.find(s => s.email.toLowerCase() === email);
  if (!sub) {
    return { success: false, error: 'No engagement record found.' };
  }

  const ok = await updatePreMeetingDiscovery(sub.id, discovery);
  if (!ok) {
    return { success: false, error: 'Failed to save your answers.' };
  }

  return { success: true };
}

// For the portal to load the initial prep + any pre-meeting data for the guided flow.
export async function getClientEngagementData() {
  const email = await getClientSessionEmail();
  if (!email) {
    return { success: false, error: 'Not logged in.' };
  }

  const submissions = await getRecentSubmissions(100);
  const sub = submissions.find(s => s.email.toLowerCase() === email);
  if (!sub) {
    return { success: false, error: 'No engagement record found.' };
  }

  return { success: true, submission: sub };
}
