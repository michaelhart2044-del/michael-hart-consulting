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
  hasEngagementCommitment,
  hasPortalAccess,
  markEngagementCommitted,
  markSubmissionSent,
  revokePortalAccess,
  saveProposalDraft,
  saveEngagementQuote,
  saveConsultTranscripts,
  savePandaDocRetainer,
  savePandaDocFinalBalance,
  savePandaDocNda,
  mergeOwnedDocuments,
  type PrepSubmission,
  setClientPasswordHash,
  updatePreMeetingDiscovery,
} from '@/lib/submissions-store';
import {
  labelForEntityCount,
  labelForFinanceTeamSize,
  labelForRevenueBand,
  financeTeamSizeToPeopleInvolved,
} from '@/lib/intake-options';
import {
  computeEngagementQuote,
  type EngagementQuoteStored,
  type EngagementPricingInput,
} from '@/lib/engagement-pricing';
import { getLatestCalendlyWebhookLog } from '@/lib/calendly-webhook-log';
import { getLatestSignWellWebhookLog } from '@/lib/signwell/webhook-log';
import { createAdminSession, verifyAdminSession, setAdminCookie, clearAdminCookie, getAdminSessionToken } from '@/lib/admin-auth';
import type { GeneratorInput } from '@/lib/proposal-generator';
import { generateProposalWithXai, isXaiProposalConfigured } from '@/lib/xai-proposal-generator';
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
import { sendProposalEmailToClient } from '@/lib/send-proposal-email';
import {
  finalizeInitialProposal,
  finalizeProposalText,
} from '@/lib/proposal-pricing';
import { canClientSignIn, mustChangePortalPassword } from '@/lib/portal-access';
import {
  PORTAL_WELCOME_EMAIL_INTRO,
  PORTAL_WELCOME_EMAIL_NEXT_STEPS,
} from '@/lib/portal-client-copy';

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
  const revenueBand = (formData.get('revenue_band') as string) || '';
  const entityCount = (formData.get('entity_count') as string) || '';
  const financeTeamSize = (formData.get('finance_team_size') as string) || '';
  const mainChallenge = (formData.get('main_challenge') as string) || '';
  const mainChallengeOther = (formData.get('main_challenge_other') as string) || '';
  const peopleInvolved =
    financeTeamSizeToPeopleInvolved(financeTeamSize) ||
    ((formData.get('people_involved') as string) || '');
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
  rawAttach += `Approximate annual revenue: ${labelForRevenueBand(revenueBand) || 'Not specified'}\n`;
  rawAttach += `Legal entities: ${labelForEntityCount(entityCount) || 'Not specified'}\n`;
  rawAttach += `Finance team (close/reporting): ${labelForFinanceTeamSize(financeTeamSize) || peopleInvolved || 'Not specified'}\n`;
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
      revenueBand: revenueBand || undefined,
      entityCount: entityCount || undefined,
      financeTeamSize: financeTeamSize || undefined,
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

async function notifyMichaelConsultBookedAction(updated: PrepSubmission | null | undefined) {
  if (!updated) return { success: false, error: 'No submission to notify.' };
  const { notifyMichaelConsultBooked } = await import('@/lib/notify-consult-booked');
  return notifyMichaelConsultBooked(updated);
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

  const booked = await markConsultationBooked(submissionId, { source: 'browser' });
  if (!booked) {
    return { success: false, error: 'Failed to record booking.' };
  }

  const { submission: updated, newlyBooked } = booked;
  if (newlyBooked) {
    const sent = await notifyMichaelConsultBookedAction(updated);
    if (!sent.success) {
      return { success: false, error: sent.error, calendlyBookedAt: updated.calendlyBookedAt };
    }
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
      comprehensiveBookedAt: s.comprehensiveBookedAt,
      calendly30CanceledAt: s.calendly30CanceledAt,
      comprehensiveCanceledAt: s.comprehensiveCanceledAt,
    }));
    return { success: true, items: safe };
  } catch {
    return { success: false, error: 'Failed to load submissions', items: [] };
  }
}

function getCalendlyWebhookPublicUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.michaelhartconsulting.com';
  return `${base.replace(/\/$/, '')}/api/webhooks/calendly`;
}

function getSignWellWebhookPublicUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.michaelhartconsulting.com';
  return `${base.replace(/\/$/, '')}/api/webhooks/signwell`;
}

export async function getCalendlyIntegrationStatusForAdmin() {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const latest = await getLatestCalendlyWebhookLog();
  const hasSuccess = latest?.outcome === 'updated';

  return {
    success: true,
    webhookUrl: getCalendlyWebhookPublicUrl(),
    signingKeyConfigured: !!process.env.CALENDLY_WEBHOOK_SIGNING_KEY,
    connected: hasSuccess,
    lastReceived: latest?.receivedAt ?? null,
    lastEvent: latest?.event ?? null,
    lastOutcome: latest?.outcome ?? null,
    lastEmail: latest?.email ?? null,
    lastDetail: latest?.detail ?? null,
  };
}

export async function getSignWellIntegrationStatusForAdmin() {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const latest = await getLatestSignWellWebhookLog();
  const hasSuccess = latest?.outcome === 'updated';

  return {
    success: true,
    webhookUrl: getSignWellWebhookPublicUrl(),
    webhookIdConfigured: !!process.env.SIGNWELL_WEBHOOK_ID?.trim(),
    connected: hasSuccess,
    lastReceived: latest?.receivedAt ?? null,
    lastEvent: latest?.eventType ?? null,
    lastOutcome: latest?.outcome ?? null,
    lastDetail: latest?.detail ?? null,
  };
}

export async function getProposalAiStatusForAdmin() {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }
  return {
    success: true,
    configured: isXaiProposalConfigured(),
    model: process.env.XAI_PROPOSAL_MODEL?.trim() || 'grok-4-1-fast-non-reasoning',
  };
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

/** Admin: email proposal to client via Resend, save draft, and mark Layer 3 sent. */
export async function sendProposalToClientForAdmin(submissionId: string, proposalText: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const trimmed = proposalText?.trim() || '';
  if (trimmed.length < 80) {
    return { success: false, error: 'Proposal text is too short — generate or edit the proposal first.' };
  }

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false, error: 'Submission not found.' };
  }

  await saveProposalDraft(submissionId, trimmed);

  const clientProposalText = finalizeProposalText(trimmed);

  if (clientProposalText !== trimmed) {
    await saveProposalDraft(submissionId, clientProposalText);
  }

  const sent = await sendProposalEmailToClient({
    clientEmail: sub.email,
    clientName: sub.name,
    proposalText: clientProposalText,
  });

  if (!sent.success) {
    return sent;
  }

  await markSubmissionSent(submissionId);
  const updated = await getSubmissionById(submissionId);

  return {
    success: true as const,
    sentAt: updated?.sentAt || new Date().toISOString(),
    message: `Proposal emailed to ${sub.name} (${sub.email}). Layer 3 marked sent.`,
  };
}

export async function saveProposalDraftForAdmin(id: string, draft: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }
  const ok = await saveProposalDraft(id, draft);
  return { success: ok };
}

export async function saveConsultTranscriptsForAdmin(
  id: string,
  consult30Transcript: string,
  consult60Transcript: string,
) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const updated = await saveConsultTranscripts(id, {
    consult30Transcript,
    consult60Transcript,
  });
  if (!updated) {
    return { success: false, error: 'Submission not found.' };
  }

  return { success: true, submission: updated };
}

// Server-side proposal generation (xAI Grok — post–30-min consult)
export async function generateInitialProposal(submissionId: string, input: GeneratorInput) {
  if (!(await requireAdmin())) {
    return { success: false, error: 'Unauthorized' };
  }

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false, error: 'Submission not found.' };
  }

  const transcript = input.consult30Transcript?.trim() || '';
  if (transcript.length < 80) {
    return {
      success: false,
      error:
        'Paste the 30-minute consult transcript in the Client Evidence Timeline (Layer 2) before generating.',
    };
  }

  if (!isXaiProposalConfigured()) {
    return {
      success: false,
      error: 'XAI_API_KEY is not configured. Add it in Vercel environment variables.',
    };
  }

  const quote = sub.engagementQuote;

  try {
    const proposal = await generateProposalWithXai({
      ...input,
      engagementQuote: sub.engagementQuote,
    });
    const finalized = finalizeInitialProposal(proposal);
    return { success: true, proposal: finalized, source: 'xai' as const };
  } catch (e) {
    console.error('xAI proposal generation failed:', e);
    const message = e instanceof Error ? e.message : 'Generation failed';
    return { success: false, error: message };
  }
}

function submissionToPricingInput(
  sub: PrepSubmission,
  consult30Transcript?: string,
): EngagementPricingInput {
  return {
    industry: sub.industry,
    revenueBand: sub.revenueBand,
    entityCount: sub.entityCount,
    financeTeamSize: sub.financeTeamSize,
    peopleInvolved: sub.peopleInvolved,
    mainChallenge: sub.mainChallenge,
    additionalChallenges: sub.additionalChallenges,
    successLooksLike: sub.successLooksLike,
    additionalContext: sub.additionalContext,
    consult30Transcript: consult30Transcript ?? sub.consult30Transcript,
  };
}

/** Admin — compute Engagement Activation Index from dossier + optional live transcript. */
export async function computeEngagementQuoteForAdmin(
  submissionId: string,
  consult30Transcript?: string,
) {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false as const, error: 'Submission not found.' };
  }

  const quote = computeEngagementQuote(submissionToPricingInput(sub, consult30Transcript));
  return { success: true as const, quote, submission: sub };
}

/** Admin — save EAI quote with optional fee overrides. */
export async function saveEngagementQuoteForAdmin(
  submissionId: string,
  quote: EngagementQuoteStored,
) {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const updated = await saveEngagementQuote(submissionId, quote);
  if (!updated) {
    return { success: false as const, error: 'Submission not found.' };
  }

  return { success: true as const, submission: updated };
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
        <p>${PORTAL_WELCOME_EMAIL_INTRO}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}<br />
        <strong>Temporary password:</strong> ${escapeHtml(tempPassword)}</p>
        <p><strong><a href="${portalUrl}">Sign in to your client portal</a></strong></p>
        <p>${PORTAL_WELCOME_EMAIL_NEXT_STEPS}</p>
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

/** Admin — PandaDoc integration configured? (never exposes secrets). */
export async function getPandaDocIntegrationStatusForAdmin() {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const { getPandaDocConfigStatus } = await import('@/lib/pandadoc/config');
  const status = getPandaDocConfigStatus();
  if (!status.configured) {
    return {
      success: true as const,
      configured: false as const,
      missing: status.missing,
    };
  }

  return {
    success: true as const,
    configured: true as const,
    clientRole: status.config.clientRole,
    contractorRole: status.config.contractorRole,
    templateConfigured: true,
  };
}

/** Admin — PandaDoc Services Invoice / final balance template configured? */
export async function getPandaDocBalanceIntegrationStatusForAdmin() {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const { getPandaDocBalanceConfigStatus } = await import('@/lib/pandadoc/config');
  const status = getPandaDocBalanceConfigStatus();
  if (!status.configured) {
    return {
      success: true as const,
      configured: false as const,
      missing: status.missing,
    };
  }

  return {
    success: true as const,
    configured: true as const,
    senderRole: status.config.senderRole,
    clientRole: status.config.clientRole,
    templateConfigured: true,
  };
}

/** Admin — PandaDoc mutual NDA template configured? */
export async function getPandaDocNdaIntegrationStatusForAdmin() {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const { getPandaDocNdaConfigStatus } = await import('@/lib/pandadoc/config');
  const status = getPandaDocNdaConfigStatus();
  if (!status.configured) {
    return {
      success: true as const,
      configured: false as const,
      missing: status.missing,
    };
  }

  return {
    success: true as const,
    configured: true as const,
    clientRole: status.config.recipientRole,
    contractorRole: status.config.ownerRole,
    templateConfigured: true,
  };
}

/**
 * Phase 2C — create a PandaDoc mutual NDA draft. Sign-only (no Collect payment).
 * Send before or alongside proposal when sharing confidential materials.
 */
export async function createPandaDocNdaForAdmin(
  submissionId: string,
  clientDetailsInput: {
    company: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  },
) {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const clientDetails = {
    company: clientDetailsInput?.company ?? '',
    streetAddress: clientDetailsInput?.streetAddress,
    city: clientDetailsInput?.city,
    state: clientDetailsInput?.state,
    postalCode: clientDetailsInput?.postalCode,
  };

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false as const, error: 'Submission not found.' };
  }

  const { getPandaDocConfigStatus, getPandaDocNdaConfigStatus, pandaDocDocumentEditUrl } =
    await import('@/lib/pandadoc/config');
  const baseConfig = getPandaDocConfigStatus();
  const ndaConfig = getPandaDocNdaConfigStatus();

  if (!baseConfig.configured) {
    return {
      success: false as const,
      error: `PandaDoc API key missing. Add ${baseConfig.missing.join(', ')} in Vercel, then redeploy.`,
    };
  }

  if (!ndaConfig.configured) {
    return {
      success: false as const,
      error: `NDA template not configured. Add ${ndaConfig.missing.join(', ')} in Vercel, then redeploy.`,
    };
  }

  const { buildNdaDocumentRequest } = await import('@/lib/pandadoc/build-nda-request');
  const {
    createDocumentFromTemplate,
    waitForDocumentDraft,
    formatPandaDocError,
  } = await import('@/lib/pandadoc/client');

  try {
    const body = await buildNdaDocumentRequest(sub, ndaConfig.config, clientDetails);
    const created = await createDocumentFromTemplate(baseConfig.config, body);

    let status = created.status;
    let readyMessage = `NDA draft ready for ${sub.name}. Pre-sign as Owner, then send to Recipient — no payment step.`;

    try {
      const draft = await waitForDocumentDraft(baseConfig.config, created.id, {
        maxAttempts: 8,
        intervalMs: 1500,
      });
      status = draft.status;
    } catch {
      readyMessage =
        `PandaDoc is still building the NDA for ${sub.name}. Refresh PandaDoc if the document is not editable yet.`;
      status = created.status || 'document.uploaded';
    }

    const nda = {
      documentId: created.id,
      documentName: created.name || body.name,
      status,
      createdAt: new Date().toISOString(),
      editUrl: pandaDocDocumentEditUrl(created.id),
    };

    const updated = await savePandaDocNda(submissionId, nda, clientDetails);
    if (!updated) {
      return { success: false as const, error: 'NDA created in PandaDoc but failed to save on client record.' };
    }

    return {
      success: true as const,
      submission: updated,
      editUrl: nda.editUrl,
      message: readyMessage,
    };
  } catch (err) {
    return { success: false as const, error: formatPandaDocError(err) };
  }
}

/**
 * Phase 2C Step 1 — create a PandaDoc retainer draft from the saved template.
 * Pre-fills client name, company, proposal date, and activation retainer amount.
 * Does not send — open in PandaDoc to pre-sign, confirm payment, then send.
 */
export async function createPandaDocRetainerForAdmin(
  submissionId: string,
  clientDetailsInput:
    | string
    | {
        company: string;
        streetAddress?: string;
        city?: string;
        state?: string;
        postalCode?: string;
      },
) {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const clientDetails =
    typeof clientDetailsInput === 'string'
      ? { company: clientDetailsInput }
      : {
          company: clientDetailsInput?.company ?? '',
          streetAddress: clientDetailsInput?.streetAddress,
          city: clientDetailsInput?.city,
          state: clientDetailsInput?.state,
          postalCode: clientDetailsInput?.postalCode,
        };

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false as const, error: 'Submission not found.' };
  }

  const { getPandaDocConfigStatus, pandaDocDocumentEditUrl } = await import('@/lib/pandadoc/config');
  const configStatus = getPandaDocConfigStatus();
  if (!configStatus.configured) {
    return {
      success: false as const,
      error: `PandaDoc is not configured. Add ${configStatus.missing.join(', ')} in Vercel, then redeploy.`,
    };
  }

  const { buildRetainerDocumentRequest, RETAINER_LINE_ITEM_NAME } = await import(
    '@/lib/pandadoc/build-retainer-request'
  );
  const { applyDocumentQuoteLineItem } = await import('@/lib/pandadoc/apply-document-quote-line-item');
  const {
    createDocumentFromTemplate,
    waitForDocumentDraft,
    formatPandaDocError,
  } = await import('@/lib/pandadoc/client');
  const { effectiveQuoteFees } = await import('@/lib/engagement-pricing');

  try {
    const body = await buildRetainerDocumentRequest(sub, configStatus.config, clientDetails);
    const created = await createDocumentFromTemplate(configStatus.config, body);
    const activationFee = effectiveQuoteFees(sub.engagementQuote!).activationFee;

    let status = created.status;
    let readyMessage =
      `PandaDoc retainer draft ready for ${sub.name}. Collect amount should match ${activationFee} automatically — assign payer to Client, then send.`;

    try {
      const draft = await waitForDocumentDraft(configStatus.config, created.id, {
        maxAttempts: 8,
        intervalMs: 1500,
      });
      status = draft.status;

      try {
        const quoteApplied = await applyDocumentQuoteLineItem(
          configStatus.config,
          created.id,
          RETAINER_LINE_ITEM_NAME,
          activationFee,
        );
        if (!quoteApplied) {
          readyMessage =
            `PandaDoc retainer draft ready for ${sub.name}. Add a Quote/pricing table to the retainer template (like the invoice) so Collect auto-fills ${activationFee}, or enter it manually. Assign payer to Client before sending.`;
        }
      } catch {
        readyMessage =
          `PandaDoc retainer draft ready for ${sub.name}. Confirm Collect payment is ${activationFee} in PandaDoc (quote line may need manual entry), assign payer to Client, then send.`;
      }
    } catch {
      readyMessage =
        `PandaDoc is still building the draft for ${sub.name} (this can take 30–60 seconds). Use Open in PandaDoc — refresh PandaDoc if the document is not editable yet.`;
      status = created.status || 'document.uploaded';
    }

    const retainer = {
      documentId: created.id,
      documentName: created.name || body.name,
      status,
      createdAt: new Date().toISOString(),
      activationFee,
      editUrl: pandaDocDocumentEditUrl(created.id),
    };

    const updated = await savePandaDocRetainer(submissionId, retainer, clientDetails);
    if (!updated) {
      return { success: false as const, error: 'Retainer created in PandaDoc but failed to save on client record.' };
    }

    return {
      success: true as const,
      submission: updated,
      editUrl: retainer.editUrl,
      message: readyMessage,
    };
  } catch (err) {
    return { success: false as const, error: formatPandaDocError(err) };
  }
}

/**
 * Phase 2C — create a PandaDoc Services Invoice draft for the final balance due at delivery.
 * Requires Step 8 and a saved engagement quote. Opens in PandaDoc for review and Collect setup.
 */
export async function createPandaDocFinalBalanceForAdmin(
  submissionId: string,
  clientDetailsInput: {
    company: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  },
) {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const clientDetails = {
    company: clientDetailsInput?.company ?? '',
    streetAddress: clientDetailsInput?.streetAddress,
    city: clientDetailsInput?.city,
    state: clientDetailsInput?.state,
    postalCode: clientDetailsInput?.postalCode,
  };

  const sub = await getSubmissionById(submissionId);
  if (!sub) {
    return { success: false as const, error: 'Submission not found.' };
  }

  const { getPandaDocConfigStatus, getPandaDocBalanceConfigStatus, pandaDocDocumentEditUrl } =
    await import('@/lib/pandadoc/config');
  const baseConfig = getPandaDocConfigStatus();
  const balanceConfig = getPandaDocBalanceConfigStatus();

  if (!baseConfig.configured) {
    return {
      success: false as const,
      error: `PandaDoc API key missing. Add ${baseConfig.missing.join(', ')} in Vercel, then redeploy.`,
    };
  }

  if (!balanceConfig.configured) {
    return {
      success: false as const,
      error: `Final balance template not configured. Add ${balanceConfig.missing.join(', ')} in Vercel, then redeploy.`,
    };
  }

  const { buildBalanceDocumentRequest } = await import('@/lib/pandadoc/build-balance-request');
  const { applyDocumentQuoteLineItem } = await import('@/lib/pandadoc/apply-document-quote-line-item');
  const { BALANCE_LINE_ITEM_NAME } = await import('@/lib/pandadoc/build-balance-request');
  const {
    createDocumentFromTemplate,
    waitForDocumentDraft,
    formatPandaDocError,
  } = await import('@/lib/pandadoc/client');
  const { effectiveQuoteFees } = await import('@/lib/engagement-pricing');

  try {
    const body = await buildBalanceDocumentRequest(sub, balanceConfig.config, clientDetails);
    const created = await createDocumentFromTemplate(baseConfig.config, body);
    const { balanceDue } = effectiveQuoteFees(sub.engagementQuote!);

    let status = created.status;
    let readyMessage =
      `Final balance invoice draft ready for ${sub.name}. Confirm Collect payment matches ${balanceDue} in PandaDoc, then send.`;

    try {
      const draft = await waitForDocumentDraft(baseConfig.config, created.id, {
        maxAttempts: 8,
        intervalMs: 1500,
      });
      status = draft.status;

      try {
        const quoteApplied = await applyDocumentQuoteLineItem(
          baseConfig.config,
          created.id,
          BALANCE_LINE_ITEM_NAME,
          balanceDue,
        );
        if (!quoteApplied) {
          readyMessage =
            `Final balance invoice draft ready for ${sub.name}. Confirm Collect payment is ${balanceDue} in PandaDoc, assign payer to Client, then send.`;
        }
      } catch {
        readyMessage =
          `Final balance invoice draft ready for ${sub.name}. Line item may need manual entry in PandaDoc — confirm price is ${balanceDue}, then set Collect and send.`;
      }
    } catch {
      readyMessage =
        `PandaDoc is still building the invoice for ${sub.name}. Refresh PandaDoc if the document is not editable yet.`;
      status = created.status || 'document.uploaded';
    }

    const invoice = {
      documentId: created.id,
      documentName: created.name || body.name,
      status,
      createdAt: new Date().toISOString(),
      balanceDue,
      editUrl: pandaDocDocumentEditUrl(created.id),
    };

    const updated = await savePandaDocFinalBalance(submissionId, invoice, clientDetails);
    if (!updated) {
      return {
        success: false as const,
        error: 'Invoice created in PandaDoc but failed to save on client record.',
      };
    }

    return {
      success: true as const,
      submission: updated,
      editUrl: invoice.editUrl,
      message: readyMessage,
    };
  } catch (err) {
    return { success: false as const, error: formatPandaDocError(err) };
  }
}

/** Which document backend the admin hub should use (owned vs PandaDoc). */
export async function getDocumentsBackendForAdmin() {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }
  const { getDocumentsBackend } = await import('@/lib/documents/config');
  return { success: true as const, backend: getDocumentsBackend() };
}

export async function getOwnedDocumentsIntegrationStatusForAdmin() {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }
  const { getSignWellNdaConfigStatus, getSignWellRetainerConfigStatus } = await import(
    '@/lib/signwell/config'
  );
  const { getPaymentInstructionsConfig } = await import('@/lib/documents/payment-policy');
  const { getQuickBooksConfigStatus } = await import('@/lib/quickbooks/invoice-draft');

  const nda = getSignWellNdaConfigStatus();
  const retainer = getSignWellRetainerConfigStatus();
  const payment = getPaymentInstructionsConfig();
  const qbo = getQuickBooksConfigStatus();

  return {
    success: true as const,
    ndaConfigured: nda.configured,
    retainerConfigured: retainer.configured,
    paymentConfigured: payment.configured,
    qboApiConfigured: qbo.configured,
    ndaMissing: nda.configured ? [] : nda.missing,
    retainerMissing: retainer.configured ? [] : retainer.missing,
    paymentMissing: payment.configured ? [] : payment.missing,
    qboMissing: qbo.configured ? [] : qbo.missing,
  };
}

async function ownedClientDetailsInput(clientDetailsInput: {
  company: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}) {
  return {
    company: clientDetailsInput?.company ?? '',
    streetAddress: clientDetailsInput?.streetAddress,
    city: clientDetailsInput?.city,
    state: clientDetailsInput?.state,
    postalCode: clientDetailsInput?.postalCode,
  };
}

/** Phase C — SignWell mutual NDA draft (sign only, no payment). */
export async function createOwnedNdaForAdmin(
  submissionId: string,
  clientDetailsInput: {
    company: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  },
) {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const clientDetails = await ownedClientDetailsInput(clientDetailsInput);
  const sub = await getSubmissionById(submissionId);
  if (!sub) return { success: false as const, error: 'Submission not found.' };

  const { getSignWellNdaConfigStatus } = await import('@/lib/signwell/config');
  const ndaConfig = getSignWellNdaConfigStatus();
  if (!ndaConfig.configured || !ndaConfig.config) {
    return {
      success: false as const,
      error: `SignWell NDA not configured. Add ${ndaConfig.missing.join(', ')} in Vercel, then redeploy.`,
    };
  }

  const { createOwnedSignWellDocument } = await import('@/lib/signwell/create-owned-document');
  const { formatSignWellError, resolveSignWellDocumentEditUrl } = await import('@/lib/signwell/client');

  try {
    const created = await createOwnedSignWellDocument('nda', sub, ndaConfig.config, clientDetails);
    const nda = {
      signwellId: created.id,
      documentName: created.name || `Mutual NDA — ${clientDetails.company || sub.name}`,
      status: created.status || 'draft',
      createdAt: new Date().toISOString(),
      editUrl: resolveSignWellDocumentEditUrl(created),
    };

    const updated = await mergeOwnedDocuments(submissionId, { nda }, clientDetails);
    if (!updated) {
      return { success: false as const, error: 'NDA created in SignWell but failed to save on client record.' };
    }

    return {
      success: true as const,
      submission: updated,
      editUrl: nda.editUrl,
      message: `NDA draft ready in SignWell for ${sub.name}. Pre-sign as Owner, then send to client — no card payments.`,
    };
  } catch (err) {
    return { success: false as const, error: formatSignWellError(err) };
  }
}

/** Phase C — SignWell activation retainer draft + remittance instructions (ACH/wire/check only). */
export async function createOwnedRetainerForAdmin(
  submissionId: string,
  clientDetailsInput: {
    company: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  },
) {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const clientDetails = await ownedClientDetailsInput(clientDetailsInput);
  const sub = await getSubmissionById(submissionId);
  if (!sub) return { success: false as const, error: 'Submission not found.' };
  if (!sub.engagementQuote?.savedAt) {
    return { success: false as const, error: 'Save engagement pricing quote first.' };
  }

  const { effectiveQuoteFees } = await import('@/lib/engagement-pricing');
  const fees = effectiveQuoteFees(sub.engagementQuote);
  if (fees.activationFee <= 0) {
    return { success: false as const, error: 'Activation fee must be greater than zero.' };
  }

  const { getSignWellRetainerConfigStatus } = await import('@/lib/signwell/config');
  const retainerConfig = getSignWellRetainerConfigStatus();
  if (!retainerConfig.configured || !retainerConfig.config) {
    return {
      success: false as const,
      error: `SignWell retainer not configured. Add ${retainerConfig.missing.join(', ')} in Vercel, then redeploy.`,
    };
  }

  const { createOwnedSignWellDocument } = await import('@/lib/signwell/create-owned-document');
  const { formatSignWellError, resolveSignWellDocumentEditUrl } = await import('@/lib/signwell/client');

  try {
    const created = await createOwnedSignWellDocument(
      'retainer',
      sub,
      retainerConfig.config,
      clientDetails,
    );
    const retainer = {
      signwellId: created.id,
      documentName: created.name || `Activation Retainer — ${clientDetails.company || sub.name}`,
      status: created.status || 'draft',
      createdAt: new Date().toISOString(),
      editUrl: resolveSignWellDocumentEditUrl(created),
      activationFee: fees.activationFee,
    };

    const updated = await mergeOwnedDocuments(submissionId, { retainer }, clientDetails);
    if (!updated) {
      return {
        success: false as const,
        error: 'Retainer created in SignWell but failed to save on client record.',
      };
    }

    return {
      success: true as const,
      submission: updated,
      editUrl: retainer.editUrl,
      message: `Retainer draft ready in SignWell. After signing, send remittance PDF + QuickBooks invoice (ACH/wire/check only).`,
    };
  } catch (err) {
    return { success: false as const, error: formatSignWellError(err) };
  }
}

/** Phase C — branded remittance instruction PDF (no card links). */
export async function generateOwnedPaymentInstructionForAdmin(
  submissionId: string,
  kind: 'activation' | 'balance',
  clientDetailsInput: {
    company: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  },
) {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const clientDetails = await ownedClientDetailsInput(clientDetailsInput);
  const sub = await getSubmissionById(submissionId);
  if (!sub) return { success: false as const, error: 'Submission not found.' };
  if (!sub.engagementQuote?.savedAt) {
    return { success: false as const, error: 'Save engagement pricing quote first.' };
  }

  if (kind === 'balance' && !sub.engagementCommittedAt) {
    return { success: false as const, error: 'Mark agreement signed & paid before generating balance instructions.' };
  }

  const { effectiveQuoteFees } = await import('@/lib/engagement-pricing');
  const { buildDocumentMergeFields } = await import('@/lib/documents/merge-fields');
  const { generatePaymentInstructionPdfBuffer } = await import('@/lib/documents/payment-instruction-pdf');

  const fees = effectiveQuoteFees(sub.engagementQuote);
  const amount = kind === 'activation' ? fees.activationFee : fees.balanceDue;
  if (amount <= 0) {
    return { success: false as const, error: 'Invoice amount must be greater than zero.' };
  }

  const fields = buildDocumentMergeFields(sub, clientDetails);
  const reference = `${kind.toUpperCase()}-${submissionId.slice(0, 8).toUpperCase()}`;

  try {
    const pdfBuffer = await generatePaymentInstructionPdfBuffer({
      kind,
      fields,
      amount,
      invoiceReference: reference,
    });

    const paymentRecord = {
      generatedAt: new Date().toISOString(),
      amount,
      reference,
    };

    const patch =
      kind === 'activation'
        ? { activationPayment: paymentRecord }
        : { balancePayment: paymentRecord };

    const updated = await mergeOwnedDocuments(submissionId, patch, clientDetails);
    if (!updated) {
      return { success: false as const, error: 'PDF generated but failed to save on client record.' };
    }

    const label = kind === 'activation' ? 'activation-retainer' : 'final-balance';
    const companySlug = (clientDetails.company || sub.name).replace(/[^\w.-]+/g, '-').slice(0, 40);

    return {
      success: true as const,
      submission: updated,
      filename: `MH-${label}-${companySlug}.pdf`,
      pdfBase64: pdfBuffer.toString('base64'),
      message: `Remittance PDF ready — send with QuickBooks invoice. ${kind === 'activation' ? 'Activation' : 'Balance'}: ${reference}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'PDF generation failed.';
    return { success: false as const, error: msg };
  }
}

/** Phase C — copy-paste QuickBooks invoice draft (disable card payments in QBO). */
export async function getQuickBooksInvoiceDraftForAdmin(
  submissionId: string,
  kind: 'activation' | 'balance',
  clientDetailsInput: {
    company: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  },
) {
  if (!(await requireAdmin())) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const clientDetails = await ownedClientDetailsInput(clientDetailsInput);
  const sub = await getSubmissionById(submissionId);
  if (!sub) return { success: false as const, error: 'Submission not found.' };

  const { buildQuickBooksInvoiceDraft } = await import('@/lib/quickbooks/invoice-draft');
  const draft = buildQuickBooksInvoiceDraft(sub, kind, clientDetails);
  if (!draft) {
    return { success: false as const, error: 'Could not build invoice draft — save pricing quote first.' };
  }

  return { success: true as const, draft };
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
