import { Resend } from 'resend';
import { site } from '@/lib/site';
import { getResendFrom } from '@/lib/resend-email';
import {
  labelForEntityCount,
  labelForFinanceTeamSize,
  labelForRevenueBand,
} from '@/lib/intake-options';
import type { PrepSubmission } from '@/lib/submissions-store';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPrepOwnerEmailHtml(sub: PrepSubmission, booked: boolean): string {
  const name = escapeHtml(sub.name);
  const email = escapeHtml(sub.email);
  const safeIndustry = escapeHtml(sub.industry);
  const safeRevenue = escapeHtml(labelForRevenueBand(sub.revenueBand));
  const safeEntities = escapeHtml(labelForEntityCount(sub.entityCount));
  const safeTeam = escapeHtml(labelForFinanceTeamSize(sub.financeTeamSize) || sub.peopleInvolved);
  const challengeDisplay = escapeHtml(sub.mainChallenge);
  const safePeople = escapeHtml(sub.peopleInvolved);
  const safeSuccess = escapeHtml(sub.successLooksLike).replace(/\n/g, '<br>');
  const safeContext = escapeHtml(sub.additionalContext).replace(/\n/g, '<br>');
  const safeAdditional = sub.additionalChallenges.map((c) => escapeHtml(c));

  return `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Industry / Business Type:</strong> ${safeIndustry || 'Not specified'}</p>
    <p><strong>Approximate annual revenue:</strong> ${safeRevenue || 'Not specified'}</p>
    <p><strong>Legal entities:</strong> ${safeEntities || 'Not specified'}</p>
    <p><strong>Finance team (close/reporting):</strong> ${safeTeam || 'Not specified'}</p>
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

/** Idempotent-safe: call only when newlyBooked is true. */
export async function notifyMichaelConsultBooked(
  submission: PrepSubmission,
): Promise<{ success: true } | { success: false; error: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: getResendFrom('Consultation Prep'),
      to: site.email,
      subject: `Initial Consultation Booked — ${submission.name.slice(0, 60)}`,
      replyTo: submission.email,
      html: buildPrepOwnerEmailHtml(submission, true),
      attachments: [
        {
          filename: 'prep-answers.txt',
          content: Buffer.from(submission.fullText).toString('base64'),
        },
      ],
    });
    return { success: true };
  } catch (error) {
    console.error('Calendly webhook: prep booking notification failed:', error);
    return { success: false, error: 'Booking recorded but notification failed.' };
  }
}