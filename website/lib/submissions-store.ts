import { promises as fs } from 'fs';
import path from 'path';

/**
 * Private, server-only store for consultation prep submissions.
 * Used exclusively by the /admin proposal generator (never exposed publicly).
 *
 * Security notes:
 * - All data stays on the server.
 * - File is written to a gitignored /data directory.
 * - In production on Vercel the filesystem is ephemeral; the in-memory cache
 *   still captures submissions since the current instance started.
 * - For durable cross-deploy storage, swap the disk functions for @vercel/kv
 *   (or Postgres/Redis) — the public API (save/getRecent etc.) stays identical.
 * - Never log full client data. Only IDs and minimal metadata are safe to log.
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
  fullText: string; // clean, structured plain text (ready for SigVai / xAI)
  sentAt?: string; // set when "Mark as Sent" is used
  preMeetingDiscovery?: {
    [questionId: string]: string; // client-friendly answers from guided portal flow (e.g. closeCycle, processOwners, etc.)
  } & {
    additionalNotes?: string;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'prep-submissions.json');
const MAX_ENTRIES = 100;

let memoryCache: PrepSubmission[] = [];
let cacheLoaded = false;

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function loadFromDisk(): Promise<PrepSubmission[]> {
  if (cacheLoaded) return memoryCache;
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryCache = parsed;
    }
  } catch {
    // File doesn't exist or is corrupt — start fresh (safe)
    memoryCache = [];
  }
  cacheLoaded = true;
  return memoryCache;
}

async function saveToDisk(list: PrepSubmission[]) {
  try {
    await ensureDataDir();
    // Keep only the newest MAX_ENTRIES
    const trimmed = [...list]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_ENTRIES);
    await fs.writeFile(FILE_PATH, JSON.stringify(trimmed, null, 2), 'utf8');
    memoryCache = trimmed;
  } catch (err) {
    // In serverless / ephemeral FS this will fail gracefully after deploy.
    // Memory cache still holds the current instance's data.
    console.error('submissions-store disk write failed (non-fatal):', err);
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

  const current = await loadFromDisk();
  const updated = [submission, ...current];
  await saveToDisk(updated);

  return submission;
}

export async function getRecentSubmissions(limit = 20): Promise<PrepSubmission[]> {
  const all = await loadFromDisk();
  return [...all]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getSubmissionById(id: string): Promise<PrepSubmission | null> {
  const all = await loadFromDisk();
  return all.find((s) => s.id === id) ?? null;
}

export async function markSubmissionSent(id: string): Promise<boolean> {
  const all = await loadFromDisk();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return false;

  all[idx] = {
    ...all[idx],
    sentAt: new Date().toISOString(),
  };
  await saveToDisk(all);
  return true;
}

/** Optional helper if we later want to attach a generated proposal draft to the record */
export async function saveProposalDraft(id: string, draft: string): Promise<boolean> {
  const all = await loadFromDisk();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return false;

  // We store the draft on the submission for simplicity (no separate drafts table)
  (all[idx] as any).proposalDraft = draft;
  await saveToDisk(all);
  return true;
}

/**
 * Update the pre-meeting discovery data for a submission.
 * Used by the client portal's guided first-time flow to collect additional
 * structured info (client-friendly questions, no internal terms like DMAIC).
 * This enriches the data for SigVai/DMAIC generation after the 1-hour meeting.
 */
export async function updatePreMeetingDiscovery(id: string, discovery: { [questionId: string]: string } & { additionalNotes?: string }): Promise<boolean> {
  const all = await loadFromDisk();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return false;

  all[idx] = {
    ...all[idx],
    preMeetingDiscovery: discovery,
  };
  await saveToDisk(all);
  return true;
}
