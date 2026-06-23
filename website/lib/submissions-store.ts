import { promises as fs } from 'fs';
import path from 'path';
import { get, put, BlobNotFoundError } from '@vercel/blob';
import type { CalendlyMeetingKind } from '@/lib/calendly-config';
import type { EngagementQuoteStored } from '@/lib/engagement-pricing';

/**
 * Private, server-only store for consultation prep submissions.
 * Used exclusively by the /admin proposal generator (never exposed publicly).
 *
 * Production: durable JSON in Vercel Blob (shared across all serverless instances).
 * Local dev: falls back to data/prep-submissions.json when BLOB_READ_WRITE_TOKEN is unset.
 */

export type CalendlyClientEventAction = '30-created' | '30-canceled' | '60-created' | '60-canceled';

export interface CalendlyClientEvent {
  at: string;
  action: CalendlyClientEventAction;
  inviteeUri?: string;
  eventSlug?: string;
}

export interface PrepSubmission {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  industry: string;
  /** Approximate annual revenue band from Step 1 intake. */
  revenueBand?: string;
  /** Legal entity count from Step 1 intake. */
  entityCount?: string;
  /** Finance team size on close/reporting from Step 1 intake. */
  financeTeamSize?: string;
  mainChallenge: string;
  additionalChallenges: string[];
  peopleInvolved: string;
  successLooksLike: string;
  additionalContext: string;
  fullText: string;
  /** 30-min initial consult booked (Calendly webhook or browser callback) */
  calendlyBookedAt?: string;
  /** 1-hr comprehensive meeting booked (portal Calendly webhook) */
  comprehensiveBookedAt?: string;
  /** Set when the 30-min booking is canceled */
  calendly30CanceledAt?: string;
  /** Set when the 1-hr booking is canceled */
  comprehensiveCanceledAt?: string;
  /** Per-client Calendly audit trail (newest first, max 20) */
  calendlyEvents?: CalendlyClientEvent[];
  /** EAI recommended / admin-saved engagement economics */
  engagementQuote?: EngagementQuoteStored;
  /** Admin-saved proposal draft */
  proposalDraft?: string;
  sentAt?: string;
  /** Step 8 — agreement signed + non-refundable fee received */
  engagementCommittedAt?: string;
  /** Step 9 — set when admin invites client to the portal after Step 8 */
  portalAccessGrantedAt?: string;
  /** Set when client clicks the email confirmation link */
  emailConfirmedAt?: string;
  /** scrypt password hash for email + password sign-in */
  portalPasswordHash?: string;
  /** True until the client sets a permanent password after first sign-in */
  mustChangePassword?: boolean;
  /** Set when admin revokes portal access (client disengaged) */
  portalRevokedAt?: string;
  preMeetingDiscovery?: {
    [questionId: string]: string;
  } & {
    additionalNotes?: string;
  };
  /** Admin — 30-minute Teams transcript / call notes */
  consult30Transcript?: string;
  /** Admin — 60-minute deep-dive transcript / meeting notes */
  consult60Transcript?: string;
  /** Client legal entity / company name for agreements (admin or PandaDoc step). */
  clientCompany?: string;
  /** Client mailing address for PandaDoc agreement tokens (optional). */
  clientStreetAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientPostalCode?: string;
  /** Phase 2C — PandaDoc engagement retainer draft linked to this client. */
  pandadocRetainer?: {
    documentId: string;
    documentName: string;
    status: string;
    createdAt: string;
    activationFee: number;
    editUrl: string;
  };
  /** Phase 2C — final balance services invoice (balance due at delivery). */
  pandadocFinalBalance?: {
    documentId: string;
    documentName: string;
    status: string;
    createdAt: string;
    balanceDue: number;
    editUrl: string;
  };
  /** Phase 2C — mutual NDA draft (sign only, no payment). */
  pandadocNda?: {
    documentId: string;
    documentName: string;
    status: string;
    createdAt: string;
    editUrl: string;
  };
  /** Phase C — owned documents (SignWell + remittance PDFs). */
  ownedDocuments?: {
    nda?: {
      signwellId: string;
      documentName: string;
      status: string;
      createdAt: string;
      editUrl: string;
    };
    retainer?: {
      signwellId: string;
      documentName: string;
      status: string;
      createdAt: string;
      editUrl: string;
      activationFee: number;
    };
    activationPayment?: {
      generatedAt: string;
      amount: number;
      reference: string;
    };
    balancePayment?: {
      generatedAt: string;
      amount: number;
      reference: string;
    };
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'prep-submissions.json');
const BLOB_PATHNAME = 'data/prep-submissions.json';
const MAX_ENTRIES = 100;
const MAX_CALENDLY_EVENTS_PER_CLIENT = 20;

function isBlobStorageEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function loadFromDisk(): Promise<PrepSubmission[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // File doesn't exist or is corrupt — start fresh
  }
  return [];
}

async function loadFromBlob(): Promise<PrepSubmission[]> {
  try {
    const result = await get(BLOB_PATHNAME, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) return [];
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err instanceof BlobNotFoundError) return [];
    console.error('submissions-store blob read failed:', err);
    return [];
  }
}

async function loadAll(): Promise<PrepSubmission[]> {
  if (isBlobStorageEnabled()) return loadFromBlob();
  return loadFromDisk();
}

async function saveToDisk(list: PrepSubmission[]) {
  try {
    await ensureDataDir();
    const trimmed = trimList(list);
    await fs.writeFile(FILE_PATH, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch (err) {
    console.error('submissions-store disk write failed (non-fatal):', err);
  }
}

async function saveToBlob(list: PrepSubmission[]) {
  const trimmed = trimList(list);
  try {
    await put(BLOB_PATHNAME, JSON.stringify(trimmed, null, 2), {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
    });
  } catch (err) {
    console.error('submissions-store blob write failed:', err);
    throw err;
  }
}

function trimList(list: PrepSubmission[]): PrepSubmission[] {
  return [...list]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_ENTRIES);
}

async function persist(list: PrepSubmission[]) {
  if (isBlobStorageEnabled()) {
    await saveToBlob(list);
  } else {
    await saveToDisk(list);
  }
}

function generateId(): string {
  return `prep_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveSubmission(data: Omit<PrepSubmission, 'id' | 'createdAt' | 'sentAt'>): Promise<PrepSubmission> {
  const now = new Date().toISOString();
  const submission: PrepSubmission = {
    id: generateId(),
    createdAt: now,
    ...data,
  };

  const current = await loadAll();
  await persist([submission, ...current]);
  return submission;
}

export async function getRecentSubmissions(limit = 20): Promise<PrepSubmission[]> {
  const all = await loadAll();
  return [...all]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

function calendlyActionForKind(
  kind: CalendlyMeetingKind,
  created: boolean,
): CalendlyClientEventAction {
  if (kind === 'consult30') return created ? '30-created' : '30-canceled';
  return created ? '60-created' : '60-canceled';
}

function appendClientCalendlyEvent(
  submission: PrepSubmission,
  action: CalendlyClientEventAction,
  meta?: { inviteeUri?: string; eventSlug?: string },
): CalendlyClientEvent[] {
  const entry: CalendlyClientEvent = {
    at: new Date().toISOString(),
    action,
    inviteeUri: meta?.inviteeUri,
    eventSlug: meta?.eventSlug,
  };
  return [entry, ...(submission.calendlyEvents || [])].slice(0, MAX_CALENDLY_EVENTS_PER_CLIENT);
}

/** Record that the client finished the 30-min Calendly booking step. */
export async function markConsultationBooked(
  id: string,
  meta?: { inviteeUri?: string; eventSlug?: string; source?: 'browser' | 'webhook' | 'admin' },
): Promise<{ submission: PrepSubmission; newlyBooked: boolean } | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const wasBooked = !!all[idx].calendlyBookedAt;
  const newlyBooked = !wasBooked;

  all[idx] = {
    ...all[idx],
    calendlyBookedAt: all[idx].calendlyBookedAt || now,
    calendly30CanceledAt: undefined,
    calendlyEvents: newlyBooked
      ? appendClientCalendlyEvent(all[idx], '30-created', meta)
      : all[idx].calendlyEvents,
  };
  await persist(all);
  return { submission: all[idx], newlyBooked };
}

/** Record 1-hr comprehensive meeting booked via Calendly webhook. */
export async function markComprehensiveBooked(
  id: string,
  meta?: { inviteeUri?: string; eventSlug?: string },
): Promise<{ submission: PrepSubmission; newlyBooked: boolean } | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const wasBooked = !!all[idx].comprehensiveBookedAt;
  const newlyBooked = !wasBooked;

  all[idx] = {
    ...all[idx],
    comprehensiveBookedAt: all[idx].comprehensiveBookedAt || now,
    comprehensiveCanceledAt: undefined,
    calendlyEvents: newlyBooked
      ? appendClientCalendlyEvent(all[idx], '60-created', meta)
      : all[idx].calendlyEvents,
  };
  await persist(all);
  return { submission: all[idx], newlyBooked };
}

/** Clear 30-min booking on Calendly cancel. */
export async function markConsultationCanceled(
  id: string,
  meta?: { inviteeUri?: string; eventSlug?: string },
): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    calendlyBookedAt: undefined,
    calendly30CanceledAt: now,
    calendlyEvents: appendClientCalendlyEvent(all[idx], '30-canceled', meta),
  };
  await persist(all);
  return all[idx];
}

/** Clear 1-hr booking on Calendly cancel. */
export async function markComprehensiveCanceled(
  id: string,
  meta?: { inviteeUri?: string; eventSlug?: string },
): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    comprehensiveBookedAt: undefined,
    comprehensiveCanceledAt: now,
    calendlyEvents: appendClientCalendlyEvent(all[idx], '60-canceled', meta),
  };
  await persist(all);
  return all[idx];
}

export async function applyCalendlyWebhookToSubmission(
  id: string,
  kind: CalendlyMeetingKind,
  event: 'invitee.created' | 'invitee.canceled',
  meta?: { inviteeUri?: string; eventSlug?: string },
): Promise<
  | { submission: PrepSubmission; newlyBooked: boolean; action: CalendlyClientEventAction }
  | null
> {
  if (event === 'invitee.created') {
    const result =
      kind === 'consult30'
        ? await markConsultationBooked(id, meta)
        : await markComprehensiveBooked(id, meta);
    if (!result) return null;
    return {
      submission: result.submission,
      newlyBooked: result.newlyBooked,
      action: calendlyActionForKind(kind, true),
    };
  }

  const submission =
    kind === 'consult30'
      ? await markConsultationCanceled(id, meta)
      : await markComprehensiveCanceled(id, meta);
  if (!submission) return null;
  return {
    submission,
    newlyBooked: false,
    action: calendlyActionForKind(kind, false),
  };
}

export async function getSubmissionById(id: string): Promise<PrepSubmission | null> {
  const all = await loadAll();
  return all.find((s) => s.id === id) ?? null;
}

function pickBestSubmissionForEmail(matches: PrepSubmission[]): PrepSubmission {
  const activePortal = matches.filter(
    (s) => !!s.portalAccessGrantedAt && !!s.portalPasswordHash,
  );
  if (activePortal.length > 0) {
    return [...activePortal].sort((a, b) =>
      (b.portalAccessGrantedAt || '').localeCompare(a.portalAccessGrantedAt || ''),
    )[0];
  }

  const committed = matches.filter((s) => !!s.engagementCommittedAt);
  if (committed.length > 0) {
    return [...committed].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  return [...matches].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export async function getSubmissionByEmail(email: string): Promise<PrepSubmission | null> {
  const normalized = email.trim().toLowerCase();
  const all = await loadAll();
  const matches = all.filter((s) => s.email.toLowerCase() === normalized);
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  return pickBestSubmissionForEmail(matches);
}

/** All intake records sharing an email (used for duplicate warnings in admin). */
export async function getSubmissionsByEmail(email: string): Promise<PrepSubmission[]> {
  const normalized = email.trim().toLowerCase();
  const all = await loadAll();
  return all.filter((s) => s.email.toLowerCase() === normalized);
}

/** Newest intake for an email that has not completed Calendly booking yet. */
export async function getLatestUnbookedSubmissionByEmail(
  email: string,
): Promise<PrepSubmission | null> {
  const matches = await getSubmissionsByEmail(email);
  const unbooked = matches.filter((s) => !s.calendlyBookedAt);
  if (unbooked.length === 0) return null;
  return [...unbooked].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** Newest record with an active 30-min booking (for cancel matching). */
export async function getLatestConsult30BookedSubmissionByEmail(
  email: string,
): Promise<PrepSubmission | null> {
  const matches = await getSubmissionsByEmail(email);
  const booked = matches.filter((s) => !!s.calendlyBookedAt);
  if (booked.length === 0) return null;
  return [...booked].sort((a, b) =>
    (b.calendlyBookedAt || '').localeCompare(a.calendlyBookedAt || ''),
  )[0];
}

/** Best portal / Step 8 record for 1-hr comprehensive booking webhooks. */
export async function getSubmissionForComprehensiveBooking(
  email: string,
): Promise<PrepSubmission | null> {
  const matches = await getSubmissionsByEmail(email);
  if (matches.length === 0) return null;

  const eligible = matches.filter(
    (s) => !!s.engagementCommittedAt || !!s.portalAccessGrantedAt,
  );
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0];
  return pickBestSubmissionForEmail(eligible);
}

/** Newest record with an active 1-hr booking (for cancel matching). */
export async function getLatestComprehensiveBookedSubmissionByEmail(
  email: string,
): Promise<PrepSubmission | null> {
  const matches = await getSubmissionsByEmail(email);
  const booked = matches.filter((s) => !!s.comprehensiveBookedAt);
  if (booked.length === 0) return null;
  return [...booked].sort((a, b) =>
    (b.comprehensiveBookedAt || '').localeCompare(a.comprehensiveBookedAt || ''),
  )[0];
}

export function hasEngagementCommitment(submission: PrepSubmission): boolean {
  return !!submission.engagementCommittedAt;
}

export function hasPortalAccess(submission: PrepSubmission): boolean {
  return !!submission.portalAccessGrantedAt;
}

export async function confirmClientEmail(submissionId: string, email: string): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === submissionId);
  if (idx === -1) return null;

  const normalized = email.trim().toLowerCase();
  if (all[idx].email.toLowerCase() !== normalized) return null;
  if (!hasPortalAccess(all[idx])) return null;

  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    emailConfirmedAt: all[idx].emailConfirmedAt || now,
  };
  await persist(all);
  return all[idx];
}

export async function setClientPasswordHash(
  submissionId: string,
  passwordHash: string,
  options?: { mustChangePassword?: boolean },
): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === submissionId);
  if (idx === -1) return null;

  const mustChangePassword =
    options && 'mustChangePassword' in options ? !!options.mustChangePassword : false;

  all[idx] = {
    ...all[idx],
    portalPasswordHash: passwordHash,
    mustChangePassword,
  };
  await persist(all);
  return all[idx];
}

/** Step 8 — record agreement signed + payment received (admin simulation). */
export async function markEngagementCommitted(id: string): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    engagementCommittedAt: all[idx].engagementCommittedAt || now,
  };
  await persist(all);
  return all[idx];
}

/** Step 9 — grant portal access and set a temporary password the client must replace on first sign-in. */
export async function grantPortalAccessWithTempPassword(
  id: string,
  passwordHash: string,
): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  if (!hasEngagementCommitment(all[idx])) {
    return null;
  }

  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    portalAccessGrantedAt: now,
    portalPasswordHash: passwordHash,
    mustChangePassword: true,
    portalRevokedAt: undefined,
  };
  await persist(all);
  return all[idx];
}

/** Admin — remove portal access. Keeps intake/proposal history for your records. */
export async function revokePortalAccess(id: string): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const updated = { ...all[idx] };
  delete updated.portalAccessGrantedAt;
  delete updated.portalPasswordHash;
  delete updated.mustChangePassword;
  delete updated.emailConfirmedAt;
  updated.portalRevokedAt = now;
  all[idx] = updated;
  await persist(all);
  return all[idx];
}

/** Admin — permanently remove a client submission record. */
export async function deleteSubmission(id: string): Promise<boolean> {
  const all = await loadAll();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  await persist(next);
  return true;
}

/** Admin — wipe all client records (intake, portal, proposals). Returns count removed. */
export async function clearAllSubmissions(): Promise<number> {
  const all = await loadAll();
  const count = all.length;
  if (count === 0) return 0;
  await persist([]);
  return count;
}

export async function markSubmissionSent(id: string): Promise<boolean> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return false;

  all[idx] = {
    ...all[idx],
    sentAt: new Date().toISOString(),
  };
  await persist(all);
  return true;
}

export async function saveProposalDraft(id: string, draft: string): Promise<boolean> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return false;

  all[idx] = { ...all[idx], proposalDraft: draft };
  await persist(all);
  return true;
}

/** Admin — persist Engagement Activation Index quote (computed + optional overrides). */
export async function saveEngagementQuote(
  id: string,
  quote: EngagementQuoteStored,
): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    engagementQuote: { ...quote, savedAt: new Date().toISOString() },
  };
  await persist(all);
  return all[idx];
}

export async function updatePreMeetingDiscovery(
  id: string,
  discovery: { [questionId: string]: string } & { additionalNotes?: string },
): Promise<boolean> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return false;

  all[idx] = {
    ...all[idx],
    preMeetingDiscovery: discovery,
  };
  await persist(all);
  return true;
}

/** Admin — persist 30-min and/or 60-min consult transcripts on the client record. */
export async function saveConsultTranscripts(
  id: string,
  transcripts: { consult30Transcript?: string; consult60Transcript?: string },
): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    ...(transcripts.consult30Transcript !== undefined
      ? { consult30Transcript: transcripts.consult30Transcript }
      : {}),
    ...(transcripts.consult60Transcript !== undefined
      ? { consult60Transcript: transcripts.consult60Transcript }
      : {}),
  };
  await persist(all);
  return all[idx];
}

/** Admin — link a PandaDoc retainer draft to the client record. */
export async function savePandaDocRetainer(
  id: string,
  retainer: NonNullable<PrepSubmission['pandadocRetainer']>,
  clientDetails?: {
    company?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  },
): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const trim = (v?: string) => v?.trim() || undefined;

  all[idx] = {
    ...all[idx],
    pandadocRetainer: retainer,
    ...(clientDetails?.company !== undefined ? { clientCompany: trim(clientDetails.company) } : {}),
    ...(clientDetails?.streetAddress !== undefined
      ? { clientStreetAddress: trim(clientDetails.streetAddress) }
      : {}),
    ...(clientDetails?.city !== undefined ? { clientCity: trim(clientDetails.city) } : {}),
    ...(clientDetails?.state !== undefined ? { clientState: trim(clientDetails.state) } : {}),
    ...(clientDetails?.postalCode !== undefined
      ? { clientPostalCode: trim(clientDetails.postalCode) }
      : {}),
  };
  await persist(all);
  return all[idx];
}

/** Admin — link a PandaDoc mutual NDA draft to the client record. */
export async function savePandaDocNda(
  id: string,
  nda: NonNullable<PrepSubmission['pandadocNda']>,
  clientDetails?: {
    company?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  },
): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const trim = (v?: string) => v?.trim() || undefined;

  all[idx] = {
    ...all[idx],
    pandadocNda: nda,
    ...(clientDetails?.company !== undefined ? { clientCompany: trim(clientDetails.company) } : {}),
    ...(clientDetails?.streetAddress !== undefined
      ? { clientStreetAddress: trim(clientDetails.streetAddress) }
      : {}),
    ...(clientDetails?.city !== undefined ? { clientCity: trim(clientDetails.city) } : {}),
    ...(clientDetails?.state !== undefined ? { clientState: trim(clientDetails.state) } : {}),
    ...(clientDetails?.postalCode !== undefined
      ? { clientPostalCode: trim(clientDetails.postalCode) }
      : {}),
  };
  await persist(all);
  return all[idx];
}

/** Admin — link a PandaDoc final balance invoice draft to the client record. */
export async function savePandaDocFinalBalance(
  id: string,
  invoice: NonNullable<PrepSubmission['pandadocFinalBalance']>,
  clientDetails?: {
    company?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  },
): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const trim = (v?: string) => v?.trim() || undefined;

  all[idx] = {
    ...all[idx],
    pandadocFinalBalance: invoice,
    ...(clientDetails?.company !== undefined ? { clientCompany: trim(clientDetails.company) } : {}),
    ...(clientDetails?.streetAddress !== undefined
      ? { clientStreetAddress: trim(clientDetails.streetAddress) }
      : {}),
    ...(clientDetails?.city !== undefined ? { clientCity: trim(clientDetails.city) } : {}),
    ...(clientDetails?.state !== undefined ? { clientState: trim(clientDetails.state) } : {}),
    ...(clientDetails?.postalCode !== undefined
      ? { clientPostalCode: trim(clientDetails.postalCode) }
      : {}),
  };
  await persist(all);
  return all[idx];
}

type ClientDetailsPatch = {
  company?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

function applyClientDetailsPatch(
  row: PrepSubmission,
  clientDetails?: ClientDetailsPatch,
): PrepSubmission {
  if (!clientDetails) return row;
  const trim = (v?: string) => v?.trim() || undefined;
  return {
    ...row,
    ...(clientDetails.company !== undefined ? { clientCompany: trim(clientDetails.company) } : {}),
    ...(clientDetails.streetAddress !== undefined
      ? { clientStreetAddress: trim(clientDetails.streetAddress) }
      : {}),
    ...(clientDetails.city !== undefined ? { clientCity: trim(clientDetails.city) } : {}),
    ...(clientDetails.state !== undefined ? { clientState: trim(clientDetails.state) } : {}),
    ...(clientDetails.postalCode !== undefined
      ? { clientPostalCode: trim(clientDetails.postalCode) }
      : {}),
  };
}

/** Admin — merge owned document records (SignWell + payment instructions). */
export async function mergeOwnedDocuments(
  id: string,
  patch: Partial<NonNullable<PrepSubmission['ownedDocuments']>>,
  clientDetails?: ClientDetailsPatch,
): Promise<PrepSubmission | null> {
  const all = await loadAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  all[idx] = applyClientDetailsPatch(
    {
      ...all[idx],
      ownedDocuments: {
        ...(all[idx].ownedDocuments || {}),
        ...patch,
      },
    },
    clientDetails,
  );
  await persist(all);
  return all[idx];
}