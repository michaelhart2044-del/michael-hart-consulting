import type { PrepSubmission } from './submissions-store';

/** Admin has invited the client (Step 9). */
export function isPortalInvited(submission: PrepSubmission): boolean {
  return !!submission.portalAccessGrantedAt;
}

/** Client confirmed their email via the verification link. */
export function isEmailConfirmed(submission: PrepSubmission): boolean {
  return !!submission.emailConfirmedAt;
}

/** Client may sign in (password or magic link). */
export function canClientSignIn(submission: PrepSubmission): boolean {
  return isPortalInvited(submission) && isEmailConfirmed(submission);
}

/** Client has set a portal password. */
export function hasPortalPassword(submission: PrepSubmission): boolean {
  return !!submission.portalPasswordHash;
}