/** Client-facing SLA — keep proposal, PandaDoc, admin, portal UI, and emails aligned. */
export const PORTAL_ACCESS_SLA = '48 hours';

/** Shared promise: agreement + activation payment → portal within SLA. */
export const PORTAL_ACCESS_PROMISE = `After agreement and activation payment, you receive access to a private client portal (within ${PORTAL_ACCESS_SLA}) to complete brief prep questions and schedule your 1-hour team meeting.`;

export const PROPOSAL_PORTAL_NEXT_STEP = PORTAL_ACCESS_PROMISE;

export const PANDADOC_RETAINER_SEND_MESSAGE = `Once signed and paid, you'll get portal access within ${PORTAL_ACCESS_SLA} to prep for our deep-dive session.`;

/** Admin — portal section helper text (SignWell + QuickBooks flow). */
export const ADMIN_STEP89_INSTRUCTION = `After the retainer is signed and activation payment clears: mark agreement signed & paid below, then grant portal access within ${PORTAL_ACCESS_SLA}. The client receives email with a temporary password and sign-in link.`;

export const ADMIN_PORTAL_DISABLED_UNTIL_STEP8 = `Portal access is disabled until agreement and payment are marked. Grant access within ${PORTAL_ACCESS_SLA} — clients receive a temporary password by email.`;

/** Portal login — footer for prospects who land without access. */
export const PORTAL_LOGIN_NO_ACCESS_NOTE = `Portal access is granted after agreement and activation payment, typically within ${PORTAL_ACCESS_SLA}.`;

/** Portal login — first-time password setup (account setup sub-flow, not journey step numbers). */
export const PORTAL_PASSWORD_SETUP_LABEL = 'Final step — Create your password';

/** Portal home — welcome and section headings (no isolated step numbers). */
export const PORTAL_WELCOME_SUBTITLE =
  'A few quick questions help us prepare. The detailed work happens on your 1-hour team meeting.';

export const PORTAL_PREP_HEADING = 'Quick Prep (about 2 minutes)';

export const PORTAL_PREP_INTRO =
  'Quick selections only — most detail will be captured together on your 1-hour call.';

export const PORTAL_PREP_COMPLETE_SUBTITLE =
  'Your prep answers are saved. Schedule your 1-hour meeting below.';

export const PORTAL_BOOKING_HEADING = 'Schedule Your 1-Hour Team Meeting';

export const PORTAL_BOOKING_INTRO =
  'Pick a time for your comprehensive process review. Your calendar invite arrives right after you book (check inbox and spam/junk).';

/** Portal welcome email — HTML body paragraphs (plain strings; caller adds greeting/credentials). */
export const PORTAL_WELCOME_EMAIL_INTRO = `Your private client portal access with Michael Hart Consulting Group LLC is now active.`;

export const PORTAL_WELCOME_EMAIL_NEXT_STEPS = `Sign in to complete brief prep questions and schedule your 1-hour team meeting. On your first sign-in you will be asked to set your own permanent password.`;
