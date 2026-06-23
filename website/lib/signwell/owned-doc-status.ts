export interface OwnedSignWellDocRecord {
  status: string;
  createdAt: string;
  completedAt?: string;
  ownerSignedAt?: string;
  recipientSignedAt?: string;
  lastSignWellEvent?: string;
}

export function normalizeSignWellStatus(raw?: string): string {
  return (raw || 'unknown').trim().toLowerCase();
}

export function isOwnedSignWellDocComplete(doc?: OwnedSignWellDocRecord): boolean {
  if (!doc) return false;

  const status = normalizeSignWellStatus(doc.status);
  if (status === 'completed' || doc.completedAt) return true;
  if (doc.ownerSignedAt && doc.recipientSignedAt) return true;
  return false;
}

/** Human-readable status for admin document cards. */
export function ownedSignWellStatusLabel(doc?: OwnedSignWellDocRecord): string | null {
  if (!doc) return null;

  const status = normalizeSignWellStatus(doc.status);
  if (status === 'completed' || doc.completedAt) {
    return 'Fully signed';
  }
  if (status === 'declined') return 'Declined by signer';
  if (status === 'canceled') return 'Canceled';
  if (status === 'expired') return 'Expired';

  if (doc.ownerSignedAt && doc.recipientSignedAt) {
    return 'Fully signed';
  }
  if (doc.ownerSignedAt) return 'Owner signed · awaiting client';
  if (doc.recipientSignedAt) return 'Client signed · awaiting owner';

  if (status === 'sent' || status === 'pending' || status === 'viewed' || status === 'in progress') {
    return 'Sent · awaiting signatures';
  }
  if (status === 'draft') return 'Draft in SignWell';

  return `Status: ${doc.status}`;
}

export function ownedSignWellStatusTone(
  doc?: OwnedSignWellDocRecord,
): 'success' | 'warning' | 'muted' | 'error' {
  const label = ownedSignWellStatusLabel(doc);
  if (!label) return 'muted';
  if (label === 'Fully signed') return 'success';
  if (label.includes('awaiting')) return 'warning';
  if (label === 'Draft in SignWell') return 'muted';
  if (label.includes('Declined') || label.includes('Canceled') || label.includes('Expired')) {
    return 'error';
  }
  return 'muted';
}
