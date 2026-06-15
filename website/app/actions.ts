'use server';

import { Resend } from 'resend';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { site } from '@/lib/site';
import { getResendFrom } from '@/lib/resend-email';
import { headers } from 'next/headers';
import {
  saveSubmission,
  markConsultationBooked,
  getRecentSubmissions,
  getSubmissionById,
  getSubmissionByEmail,
  getLatestUnbookedSubmissionByEmail,
  grantPortalAccessWithTempPassword,
  deleteSubmission,
  clearAllSubmissions,
  hasEngagementCommitment,
  hasPortalAccess,
  markEngagementCommitted,
  markSubmissionSent,
  revokePortalAccess,
  saveProposalDraft,
  setClientPasswordHash,
  updatePreMeetingDiscovery,
} from '@/lib/submissions-store';
import { createAdminSession, verifyAdminSession, setAdminCookie, clearAdminCookie, getAdminSessionToken } from '@/lib/admin-auth';
import { generateProposal, GeneratorInput } from '@/lib/proposal-generator';
import {
  setClientCookie,
  clearClientCookie,
  getClientSessionEmail,
} from '@/lib/client-auth';
import {
  generateTemporaryPassword,
  hashClientPassword,
  isPasswordStrongEnough,
  verifyClientPassword,
} from '@/lib/client-password';
import { canClientSignIn, mustChangePortalPassword } from '@/lib/portal-access';

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
      from: getResendFrom('Contact Form'),
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
        from: getResendFrom(),
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

function buildPrepOwnerEmailHtml(sub: {
  name: string;
  email: string;
  industry: string;
  mainChallenge: string;
  additionalChallenges: string[];
  peopleInvolved: string;
  successLooksLike: string;
  additionalContext: string;
}, booked: boolean): string {
  const name = escapeHtml(sub.name);
  const email = escapeHtml(sub.email);
  const safeIndustry = escapeHtml(sub.industry);
  const challengeDisplay = escapeHtml(sub.mainChallenge);
  const safePeople = escapeHtml(sub.peopleInvolved);
  const safeSuccess = escapeHtml(sub.successLooksLike).replace(/\n/g, '<br>');
  const safeContext = escapeHtml(sub.additionalContext).replace(/\n/g, '<br>');
  const safeAdditional = sub.additionalChallenges.map((c) => escapeHtml(c));

  return `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Industry / Business Type:</strong> ${safeIndustry || 'Not specified'}</p>
    <p><strong>Main Challenge:</strong> ${challengeDisplay || 'Not specified'}</p>
    ${safeAdditional.length > 0 ? `
      <p><strong>Additional challenges:</strong></p>
      <ul style="margin:4px 0 12px 16px; padding:0; list-style:none;">
        ${safeAdditional.map((c) => `<li style="margin:2px 0;">• ${c}</li>`).join('')}
      </ul>
    ` : ''}
    <p><strong>People involved in month-end / reporting:</strong> ${safePeople || 'Not specified'}</p>
    <p><strong>What success looks like (30–90 days):</strong><br>${safeSuccess || '<em>Not specified</em>'}</p>
    ${safeContext ? `<p><strong>Deadlines, stakeholders or upcoming changes:</strong><br>${safeContext}</p>` : ''}
    <p style="margin-top:16px;font-size:12px;color:#666;">Submitted via the prep form on ${site.name}.</p>
    ${booked
      ? '<p style="font-size:12px;color:#888;"><em>Consultation is booked — you will also receive a Calendly notification with the meeting time and Teams link.</em></p>'
      : '<p style="font-size:12px;color:#888;"><em>Booking not completed yet — visible in /admin only until the client schedules.</em></p>'}
    <p><small>Answers also attached as prep-answers.txt for easy import into SigVai / xAI.</small></p>
  `;
}

/**
 * Server action for the prep form on /prepare-analysis (Step 1 — Continue).
 * Saves to admin store only. Michael is emailed after the client completes Calendly (Step 2).
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

  let mainChallengeDisplay = mainChallenge || 'Not specified';
  if (mainChallenge === 'Other (please describe)' && mainChallengeOther.trim()) {
    mainChallengeDisplay = `${mainChallenge} — ${mainChallengeOther.trim()}`;
  }

  let rawAttach = `Prep Answers for ${rawName.trim()} <${rawEmail.trim()}>\n\n`;
  rawAttach += `Industry / Business Type: ${industry || 'Not specified'}\n`;
  rawAttach += `Main Challenge: ${mainChallengeDisplay}\n`;
  if (additionalChallengesList.length > 0) {
    rawAttach += `Additional challenges:\n${additionalChallengesList.map((c: string) => `- ${c}`).join('\n')}\n`;
  }
  rawAttach += `People involved in month-end / reporting: ${peopleInvolved || 'Not specified'}\n`;
  rawAttach += `What success looks like (30–90 days): ${successLooksLike || 'Not specified'}\n`;
  rawAttach += `Additional context / deadlines: ${additionalContext || 'Not specified'}\n`;

  try {
    const submission = await saveSubmission({
      name: rawName.trim(),
      email: rawEmail.trim(),
      industry: industry || 'Not specified',
      mainChallenge: mainChallengeDisplay,
      additionalChallenges: additionalChallengesList,
      peopleInvolved: peopleInvolved || '',
      successLooksLike: successLooksLike || '',
      additionalContext: additionalContext || '',
      fullText: rawAttach,
    });
    return { success: true, submissionId: submission.id };
  } catch (storeErr) {
    console.error('Failed to persist prep submission:', storeErr);
    return { success: false, error: 'Failed to save your details. Please try again or email us directly.' };
  }
}

async function notifyMichaelConsultBooked(updated: Awaited<ReturnType<typeof markConsultationBooked>>) {
  if (!updated) return { success: false, error: 'No submission to notify.' };

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: getResendFrom('Consultation Prep'),
      to: site.email,
      subject: `Initial Consultation Booked — ${updated.name.slice(0, 60)}`,
      replyTo: updated.email,
      html: buildPrepOwnerEmailHtml(updated, true),
      attachments: [
        {
          filename: 'prep-answers.txt',
          content: Buffer.from(updated.fullText).toString('base64'),
        },
      ],
    });
    return { success: true };
  } catch (error) {
    console.error('Prep booking notification failed:', error);
    return { success: false, error: 'Booking recorded but notification failed.' };
  }
}

/** Step 2 — client finished Calendly: notify Michael with prep attachment + mark booked in admin. */
export async function completePrepBooking(submissionId: string) {
  if (!submissionId?.trim()) {
    return { success: false, error: 'Missing submission reference.' };
  }

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false, error: 'Submission not found.' };
  }

  if (sub.calendlyBookedAt) {
    return { success: true, alreadyBooked: true, calendlyBookedAt: sub.calendlyBookedAt };
  }

  const updated = await markConsultationBooked(submissionId);
  if (!updated) {
    return { success: false, error: 'Failed to record booking.' };
  }

  const sent = await notifyMichaelConsultBooked(updated);
  if (!sent.success) {
    return { success: false, error: sent.error, calendlyBookedAt: updated.calendlyBookedAt };
  }

  return { success: true, calendlyBookedAt: updated.calendlyBookedAt };
}

/** Fallback when Calendly fires but the browser lost the submission id — match by client email. */
export async function completePrepBookingByEmail(email: string) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: 'Missing client email.' };
  }

  const sub = await getLatestUnbookedSubmissionByEmail(normalized);
  if (!sub) {
    const existing = await getSubmissionByEmail(normalized);
    if (existing?.calendlyBookedAt) {
      return { success: true, alreadyBooked: true, calendlyBookedAt: existing.calendlyBookedAt };
    }
    return { success: false, error: 'No pending prep submission found for this email.' };
  }

  return completePrepBooking(sub.id);
}

/** Admin-only: manually mark consult booked if Calendly callback was missed. */
export async function markConsultBookedForAdmin(submissionId: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false, error: 'Submission not found.' };
  }

  if (sub.calendlyBookedAt) {
    return {
      success: true,
      alreadyBooked: true,
      calendlyBookedAt: sub.calendlyBookedAt,
      message: 'Already marked as consult booked.',
    };
  }

  const updated = await markConsultationBooked(submissionId);
  if (!updated) {
    return { success: false, error: 'Failed to record booking.' };
  }

  return {
    success: true,
    calendlyBookedAt: updated.calendlyBookedAt,
    message: `Marked CONSULT BOOKED for ${updated.name}.`,
  };
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
      engagementCommittedAt: s.engagementCommittedAt,
      portalAccessGrantedAt: s.portalAccessGrantedAt,
      mustChangePassword: s.mustChangePassword,
      portalRevokedAt: s.portalRevokedAt,
      calendlyBookedAt: s.calendlyBookedAt,
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
   CLIENT PORTAL ACTIONS (Step 9+ only — post-agreement access)
   Email confirmation + password or magic-link sign-in.
   Portal access is granted exclusively from /admin after Steps 1–8.
   ============================================================ */

const portalRateLimitMap = new Map<string, number[]>();

function isPortalRateLimited(key: string, max = 8, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const arr = (portalRateLimitMap.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return true;
  arr.push(now);
  portalRateLimitMap.set(key, arr);
  return false;
}

function getSiteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || site.url || 'http://localhost:3000';
}

async function sendPortalAccessEmail(
  email: string,
  tempPassword: string,
  clientName?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const greeting = clientName?.split(' ')[0] || 'there';
  const portalUrl = `${getSiteBaseUrl()}/portal/login`;

  try {
    await resend.emails.send({
      from: getResendFrom('Client Portal'),
      to: email,
      subject: `Your private client portal access — ${site.name}`,
      html: `
        <p>Hi ${greeting},</p>
        <p>Your private client portal access with ${site.name} is now active.</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}<br />
        <strong>Temporary password:</strong> ${escapeHtml(tempPassword)}</p>
        <p><strong><a href="${portalUrl}">Sign in to your client portal</a></strong></p>
        <p>On your first sign-in you will be asked to set your own permanent password.</p>
        <p>If you did not expect this email, you can safely ignore it.</p>
        <p>Best regards,<br />Michael Hart<br />${site.name}</p>
      `,
    });
    return { success: true };
  } catch (e) {
    console.error('Portal access email failed:', e);
    return { success: false, error: 'Failed to send the portal access email. Please try again.' };
  }
}

async function grantPortalAccessAndEmail(submissionId: string): Promise<PortalAccessAdminResult> {
  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false, error: 'Submission not found.' };
  }

  if (!hasEngagementCommitment(sub)) {
    return {
      success: false,
      error: 'Step 8 required first: mark agreement signed and payment received before granting portal access.',
      portalAccessGrantedAt: sub.portalAccessGrantedAt,
    };
  }

  const tempPassword = generateTemporaryPassword();
  const hash = await hashClientPassword(tempPassword);
  const updated = await grantPortalAccessWithTempPassword(submissionId, hash);
  if (!updated?.portalAccessGrantedAt) {
    return { success: false, error: 'Failed to grant portal access.' };
  }

  const sent = await sendPortalAccessEmail(updated.email, tempPassword, updated.name);
  if (!sent.success) {
    return { success: false, error: sent.error, portalAccessGrantedAt: updated.portalAccessGrantedAt };
  }

  return {
    success: true,
    portalAccessGrantedAt: updated.portalAccessGrantedAt,
    message: `Portal access granted. Welcome email with temporary password sent to ${updated.email}.`,
  };
}

/** Step 8 — admin-only: simulate agreement signed + payment received. */
export async function markEngagementCommittedForAdmin(submissionId: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false, error: 'Submission not found.' };
  }

  const updated = await markEngagementCommitted(submissionId);
  if (!updated) {
    return { success: false, error: 'Failed to record engagement commitment.' };
  }

  return {
    success: true,
    engagementCommittedAt: updated.engagementCommittedAt,
    message: `Step 8 complete for ${updated.name}. You can now grant portal access (Step 9).`,
  };
}

type PortalAccessAdminResult =
  | { success: true; portalAccessGrantedAt: string; message: string }
  | { success: false; error: string; portalAccessGrantedAt?: string };

/** Step 9 — admin-only: grant portal access and email a temporary password. */
export async function grantPortalAccessForAdmin(submissionId: string): Promise<PortalAccessAdminResult> {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const existing = await getSubmissionById(submissionId);
  if (
    existing &&
    hasPortalAccess(existing) &&
    existing.portalPasswordHash &&
    existing.mustChangePassword !== false
  ) {
    return {
      success: true,
      portalAccessGrantedAt: existing.portalAccessGrantedAt!,
      message: `Portal access already granted for ${existing.name}. Use Resend Portal Access if the client needs a new email.`,
    };
  }

  return grantPortalAccessAndEmail(submissionId);
}

/** Admin-only: resend portal access email with a new temporary password. */
export async function resendPortalAccessForAdmin(submissionId: string): Promise<PortalAccessAdminResult> {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const sub = await getSubmissionById(submissionId);
  if (!sub || !hasPortalAccess(sub)) {
    return { success: false, error: 'Portal access has not been granted yet.' };
  }

  return grantPortalAccessAndEmail(submissionId);
}

/** Admin-only: revoke portal access when a client disengages or for a clean re-test. */
export async function revokePortalAccessForAdmin(submissionId: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false, error: 'Submission not found.' };
  }

  if (!hasPortalAccess(sub)) {
    return { success: false, error: 'This client does not have active portal access.' };
  }

  const updated = await revokePortalAccess(submissionId);
  if (!updated) {
    return { success: false, error: 'Failed to revoke portal access.' };
  }

  revalidatePath('/portal');
  revalidatePath('/portal/login');
  return {
    success: true,
    portalRevokedAt: updated.portalRevokedAt,
    message: `Portal access revoked for ${updated.name}. They can no longer sign in. Grant access again anytime to re-onboard.`,
  };
}

/** Admin-only: permanently delete every client record — for a clean live test or full reset. */
export async function clearAllClientsForAdmin(confirmation: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  if (confirmation !== 'DELETE ALL') {
    return { success: false, error: 'Confirmation phrase did not match.' };
  }

  const count = await clearAllSubmissions();
  revalidatePath('/portal');
  revalidatePath('/portal/login');
  return {
    success: true,
    count,
    message:
      count === 0
        ? 'No client records to delete — already empty.'
        : `Deleted ${count} client record${count === 1 ? '' : 's'}. Ready for a fresh live test.`,
  };
}

/** Admin-only: permanently delete a client record (intake + portal data). */
export async function deleteClientForAdmin(submissionId: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false, error: 'Submission not found.' };
  }

  const ok = await deleteSubmission(submissionId);
  if (!ok) {
    return { success: false, error: 'Failed to delete client record.' };
  }

  revalidatePath('/portal');
  revalidatePath('/portal/login');
  return {
    success: true,
    message: `Deleted all records for ${sub.name} (${sub.email}).`,
  };
}

/** Client password sign-in — requires admin-granted portal access. */
export async function clientSignInWithPassword(formData: FormData) {
  const honeypot = formData.get('company_website') as string;
  if (honeypot?.trim()) return { success: true };

  const email = ((formData.get('email') as string) || '').trim().toLowerCase();
  const password = (formData.get('password') as string) || '';

  if (!email) return { success: false, error: 'Please enter your email address.' };
  if (!password) return { success: false, error: 'Please enter your password.' };

  const ip = await getClientIp();
  if (isPortalRateLimited(`portal-signin:ip:${ip}`, 10) || isPortalRateLimited(`portal-signin:email:${email}`, 8)) {
    return { success: false, error: 'Too many sign-in attempts. Please wait a few minutes and try again.' };
  }

  let sub = await getSubmissionByEmail(email);
  if (!sub) {
    return { success: false, error: 'No portal account found for this email.' };
  }

  if (!canClientSignIn(sub)) {
    // Brief retry — Vercel Blob can lag a few hundred ms after admin grants access.
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      sub = await getSubmissionByEmail(email);
      if (sub && canClientSignIn(sub)) break;
    }
  }

  if (!sub || !canClientSignIn(sub)) {
    return {
      success: false,
      error: 'Portal access has not been granted yet. You will receive an email after your agreement and payment are complete.',
    };
  }

  if (!sub.portalPasswordHash) {
    return { success: false, error: 'No password is set for this account. Contact Michael to resend your portal access email.' };
  }

  const valid = await verifyClientPassword(password, sub.portalPasswordHash);
  if (!valid) {
    return { success: false, error: 'Incorrect email or password.' };
  }

  await setClientCookie(sub.email);
  revalidatePath('/portal');
  revalidatePath('/portal/login');
  return { success: true, mustChangePassword: mustChangePortalPassword(sub) };
}

type PasswordSetupResult = { success: true } | { success: false; error: string };

/** Client sets a permanent password after first sign-in (required when mustChangePassword is set). */
async function completeClientPasswordSetup(formData: FormData): Promise<PasswordSetupResult> {
  const email = await getClientSessionEmail();
  if (!email) return { success: false, error: 'Please sign in first.' };

  const password = (formData.get('password') as string) || '';
  const confirm = (formData.get('confirm_password') as string) || '';

  if (!isPasswordStrongEnough(password)) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }
  if (password !== confirm) {
    return { success: false, error: 'Passwords do not match.' };
  }

  const ip = await getClientIp();
  if (isPortalRateLimited(`portal-password:ip:${ip}`, 6)) {
    return { success: false, error: 'Too many attempts. Please wait a few minutes.' };
  }

  const sub = await getSubmissionByEmail(email);
  if (!sub || !canClientSignIn(sub)) {
    return { success: false, error: 'Portal access not active.' };
  }

  if (!mustChangePortalPassword(sub)) {
    return { success: true };
  }

  const hash = await hashClientPassword(password);
  const updated = await setClientPasswordHash(sub.id, hash, { mustChangePassword: false });
  if (!updated || mustChangePortalPassword(updated)) {
    return { success: false, error: 'Failed to save your password. Please try again.' };
  }

  // Confirm the write landed (Blob can be briefly eventually consistent).
  for (let attempt = 0; attempt < 3; attempt++) {
    const fresh = await getSubmissionById(sub.id);
    if (fresh && !mustChangePortalPassword(fresh)) {
      revalidatePath('/portal');
      revalidatePath('/portal/login');
      return { success: true };
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return { success: false, error: 'Password saved but could not be verified. Please try again.' };
}

/** Form action: save permanent password then server-redirect into the portal. */
export async function clientChangePasswordAndEnterPortal(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const result = await completeClientPasswordSetup(formData);
  if (!result.success) {
    return { error: result.error };
  }
  redirect('/portal');
}

/** @deprecated Use clientChangePasswordAndEnterPortal — kept for any legacy callers. */
export async function clientChangePassword(formData: FormData) {
  return completeClientPasswordSetup(formData);
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

  const sub = await getSubmissionByEmail(email);
  if (!sub) {
    return { success: false, error: 'No engagement record found.' };
  }

  if (!canClientSignIn(sub)) {
    return { success: false, error: 'Portal access not activated.' };
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

  const sub = await getSubmissionByEmail(email);
  if (!sub) {
    return { success: false, error: 'No engagement record found.' };
  }

  if (!canClientSignIn(sub)) {
    await clearClientCookie();
    return {
      success: false,
      error: sub.portalRevokedAt
        ? 'Your portal access is no longer active. Please contact Michael if you believe this is an error.'
        : 'Portal access not activated.',
    };
  }

  return {
    success: true,
    submission: sub,
    mustChangePassword: mustChangePortalPassword(sub),
  };
}
