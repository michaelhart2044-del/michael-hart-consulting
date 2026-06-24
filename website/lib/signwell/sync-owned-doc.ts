import { contractorProfile } from '@/lib/pandadoc/contractor';
import { getSignWellConfigStatus } from '@/lib/signwell/config';
import { getDocument, type SignWellDocumentResponse } from '@/lib/signwell/client';
import {
  normalizeSignWellStatus,
  type OwnedSignWellDocRecord,
} from '@/lib/signwell/owned-doc-status';
import {
  mergeOwnedDocuments,
  type OwnedDocKind,
  type PrepSubmission,
} from '@/lib/submissions-store';

type StoredOwnedSignWellDoc = OwnedSignWellDocRecord & {
  signwellId: string;
  documentName: string;
  editUrl: string;
  activationFee?: number;
};

function recipientSigned(recipient: { status?: string; email?: string }): boolean {
  const status = normalizeSignWellStatus(recipient.status);
  return status === 'completed' || status === 'signed';
}

function syncDocFromApi(
  existing: StoredOwnedSignWellDoc,
  doc: SignWellDocumentResponse,
): StoredOwnedSignWellDoc {
  const status = normalizeSignWellStatus(doc.status);
  const ownerEmail = contractorProfile.email.trim().toLowerCase();
  let ownerSignedAt = existing.ownerSignedAt;
  let recipientSignedAt = existing.recipientSignedAt;

  for (const recipient of doc.recipients || []) {
    if (!recipientSigned(recipient)) continue;
    const email = (recipient.email || '').trim().toLowerCase();
    if (email === ownerEmail) {
      ownerSignedAt = ownerSignedAt || new Date().toISOString();
    } else {
      recipientSignedAt = recipientSignedAt || new Date().toISOString();
    }
  }

  const fullySigned =
    status === 'completed' || !!(ownerSignedAt && recipientSignedAt);

  return {
    ...existing,
    status: fullySigned ? 'completed' : status || existing.status,
    ...(fullySigned
      ? { completedAt: existing.completedAt || new Date().toISOString() }
      : {}),
    ownerSignedAt,
    recipientSignedAt,
  };
}

/** Pull latest SignWell status into the dossier (e.g. after reload). */
export async function syncOwnedSignWellDocsForSubmission(
  sub: PrepSubmission,
): Promise<PrepSubmission> {
  const cfg = getSignWellConfigStatus();
  if (!cfg.configured || !cfg.config) return sub;

  const owned = sub.ownedDocuments;
  if (!owned?.nda?.signwellId && !owned?.retainer?.signwellId) return sub;

  const patch: Partial<NonNullable<PrepSubmission['ownedDocuments']>> = {};
  const kinds: OwnedDocKind[] = ['nda', 'retainer'];

  for (const kind of kinds) {
    const existing = kind === 'nda' ? owned.nda : owned.retainer;
    if (!existing?.signwellId) continue;

    try {
      const doc = await getDocument(cfg.config, existing.signwellId);
      const synced = syncDocFromApi(existing, doc);
      const unchanged =
        synced.status === existing.status &&
        synced.completedAt === existing.completedAt &&
        synced.ownerSignedAt === existing.ownerSignedAt &&
        synced.recipientSignedAt === existing.recipientSignedAt;

      if (!unchanged) {
        if (kind === 'nda') {
          patch.nda = synced;
        } else {
          patch.retainer = synced as NonNullable<
            NonNullable<PrepSubmission['ownedDocuments']>['retainer']
          >;
        }
      }
    } catch {
      // Document deleted in SignWell — leave dossier as-is; Regenerate creates a new one.
    }
  }

  if (!patch.nda && !patch.retainer) return sub;
  return (await mergeOwnedDocuments(sub.id, patch)) || sub;
}
