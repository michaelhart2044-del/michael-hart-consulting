export type DocumentsBackend = 'owned' | 'pandadoc';

/** Which document stack the admin hub uses. Default: owned when SignWell is configured. */
export function getDocumentsBackend(): DocumentsBackend {
  const explicit = process.env.DOCUMENTS_BACKEND?.trim().toLowerCase();
  if (explicit === 'pandadoc' || explicit === 'owned') return explicit;
  if (process.env.SIGNWELL_API_KEY?.trim()) return 'owned';
  return 'pandadoc';
}

export function isOwnedDocumentsBackend(): boolean {
  return getDocumentsBackend() === 'owned';
}
