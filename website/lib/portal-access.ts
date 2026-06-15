import type { PrepSubmission } from './submissions-store';

/** Admin has granted portal access (Step 9). */
export function isPortalInvited(submission: PrepSubmission): boolean {
  return !!submission.portalAccessGrantedAt;
}

/** Client may sign in with email + password. */
export function canClientSignIn(submission: PrepSubmission): boolean {
  return isPortalInvited(submission) && !!submission.portalPasswordHash;
}

/** Client must set a permanent password before using the portal. */
export function mustChangePortalPassword(submission: PrepSubmission): boolean {
  return !!submission.mustChangePassword;
}

/** Client has set a permanent portal password. */
export function hasPermanentPortalPassword(submission: PrepSubmission): boolean {
  return !!submission.portalPasswordHash && !submission.mustChangePassword;
}