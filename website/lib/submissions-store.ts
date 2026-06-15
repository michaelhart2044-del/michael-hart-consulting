import { promises as fs } from 'fs';
import path from 'path';
import { get, put, BlobNotFoundError } from '@vercel/blob';

/**
 * Private, server-only store for consultation prep submissions.
 * Used exclusively by the /admin proposal generator (never exposed publicly).
 *
 * Production: durable JSON in Vercel Blob (shared across all serverless instances).
 * Local dev: falls back to data/prep-submissions.json when BLOB_READ_WRITE_TOKEN is unset.
 */

export interface PrepSubmission {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  industry: string;
  mainChallenge: string;
  additionalChallenges: string[];
  peopleInvolved: string;
  successLooksLike: string;
  additionalContext: string;
  fullText: string;
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
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'prep-submissions.json');
const BLOB_PATHNAME = 'data/prep-submissions.json';
const MAX_ENTRIES = 100;

function useBlobStorage(): boolean {
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
  if (useBlobStorage()) return loadFromBlob();
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
  if (useBlobStorage()) {
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

export async function getSubmissionById(id: string): Promise<PrepSubmission | null> {
  const all = await loadAll();
  return all.find((s) => s.id === id) ?? null;
}

export async function getSubmissionByEmail(email: string): Promise<PrepSubmission | null> {
  const normalized = email.trim().toLowerCase();
  const all = await loadAll();
  return all.find((s) => s.email.toLowerCase() === normalized) ?? null;
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

  all[idx] = {
    ...all[idx],
    portalPasswordHash: passwordHash,
    mustChangePassword: options?.mustChangePassword ?? false,
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
  const { portalAccessGrantedAt: _g, portalPasswordHash: _p, mustChangePassword: _m, emailConfirmedAt: _e, ...rest } = all[idx];
  all[idx] = {
    ...rest,
    portalRevokedAt: now,
  };
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

  (all[idx] as PrepSubmission & { proposalDraft?: string }).proposalDraft = draft;
  await persist(all);
  return true;
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