import type { PrepSubmission } from '@/lib/submissions-store';
import { isOwnedSignWellDocComplete } from '@/lib/signwell/owned-doc-status';
import type { DocumentsBackendMode } from '@/lib/admin/client-journey/types';

/**
 * Which document stack applies to this client record.
 * Owned SignWell data always wins — legacy PandaDoc fields are ignored when present.
 */
export function resolveDocumentsBackend(
  sub: PrepSubmission,
  configuredBackend: DocumentsBackendMode,
): DocumentsBackendMode {
  if (sub.ownedDocuments?.nda || sub.ownedDocuments?.retainer) return 'owned';
  if (sub.pandadocNda || sub.pandadocRetainer || sub.pandadocFinalBalance) {
    return 'pandadoc';
  }
  return configuredBackend;
}

export function hasConsultProgress(sub: PrepSubmission, consult30Len: number): boolean {
  return (
    !!sub.calendlyBookedAt ||
    consult30Len >= 80 ||
    (sub.consult30Transcript?.trim().length ?? 0) >= 80
  );
}

/** Fully signed mutual NDA — SignWell completion or legacy PandaDoc draft linked. */
export function isNdaComplete(sub: PrepSubmission, backend: DocumentsBackendMode): boolean {
  if (backend === 'owned') {
    const doc = sub.ownedDocuments?.nda;
    return !!doc && isOwnedSignWellDocComplete(doc);
  }
  return !!sub.pandadocNda;
}

export function isNdaInProgress(sub: PrepSubmission, backend: DocumentsBackendMode): boolean {
  if (backend === 'owned') {
    return !!sub.ownedDocuments?.nda && !isNdaComplete(sub, backend);
  }
  return !!sub.pandadocNda && !isNdaComplete(sub, backend);
}

/** Activation retainer fully signed in SignWell (or legacy PandaDoc draft). */
export function isRetainerSigned(sub: PrepSubmission, backend: DocumentsBackendMode): boolean {
  if (backend === 'owned') {
    const doc = sub.ownedDocuments?.retainer;
    return !!doc && isOwnedSignWellDocComplete(doc);
  }
  return !!sub.pandadocRetainer;
}

export function isRetainerInProgress(sub: PrepSubmission, backend: DocumentsBackendMode): boolean {
  if (backend === 'owned') {
    return !!sub.ownedDocuments?.retainer && !isRetainerSigned(sub, backend);
  }
  return !!sub.pandadocRetainer && !isRetainerSigned(sub, backend);
}

/**
 * Agreement = signed + paid.
 * Owned path: manual Step 8 mark only (engagementCommittedAt) — not retainer draft alone.
 */
export function isAgreementComplete(
  sub: PrepSubmission,
  backend: DocumentsBackendMode,
): boolean {
  if (backend === 'owned') {
    return !!sub.engagementCommittedAt;
  }
  return !!sub.engagementCommittedAt || !!sub.pandadocRetainer;
}

export function isProposalComplete(sub: PrepSubmission): boolean {
  return !!(sub.sentAt || (sub.proposalDraft && sub.proposalDraft.trim().length > 20));
}
