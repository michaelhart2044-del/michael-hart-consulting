import type { PrepSubmission } from '@/lib/submissions-store';
import {
  isAgreementComplete,
  isNdaComplete,
  isNdaInProgress,
  isProposalComplete,
  isRetainerSigned,
  resolveDocumentsBackend,
} from '@/lib/admin/client-journey/checkpoints';
import type { ClientListBadge, DocumentsBackendMode } from '@/lib/admin/client-journey/types';

export function buildClientListBadges(
  sub: PrepSubmission,
  configuredBackend: DocumentsBackendMode,
): ClientListBadge[] {
  const backend = resolveDocumentsBackend(sub, configuredBackend);
  const badges: ClientListBadge[] = [];

  if (isNdaComplete(sub, backend)) {
    badges.push({ id: 'nda-signed', label: 'NDA SIGNED', tone: 'success' });
  } else if (isNdaInProgress(sub, backend)) {
    badges.push({ id: 'nda-pending', label: 'NDA PENDING', tone: 'warning' });
  }

  if (isProposalComplete(sub)) {
    badges.push({ id: 'proposal-sent', label: 'PROPOSAL SENT', tone: 'info' });
  }

  if (isRetainerSigned(sub, backend)) {
    badges.push({ id: 'retainer-signed', label: 'RETAINER SIGNED', tone: 'success' });
  } else if (backend === 'owned' && sub.ownedDocuments?.retainer) {
    badges.push({ id: 'retainer-pending', label: 'RETAINER PENDING', tone: 'warning' });
  } else if (backend === 'pandadoc' && sub.pandadocRetainer) {
    badges.push({ id: 'retainer-draft', label: 'RETAINER DRAFT', tone: 'muted' });
  }

  if (isAgreementComplete(sub, backend)) {
    badges.push({ id: 'agreement', label: 'AGREEMENT', tone: 'success' });
  }

  if (sub.leadSource === 'referral') {
    badges.push({ id: 'referral', label: 'REFERRAL', tone: 'info' });
  }

  return badges;
}
