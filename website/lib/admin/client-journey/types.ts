import type { PrepSubmission } from '@/lib/submissions-store';

/** Active document stack — owned (SignWell) vs legacy PandaDoc. */
export type DocumentsBackendMode = 'owned' | 'pandadoc';

export type JourneyPhaseId =
  | 'intake'
  | 'consult'
  | 'pricing'
  | 'nda'
  | 'proposal'
  | 'agreement'
  | 'portal'
  | 'delivery';

export type JourneyPhaseStatus = 'complete' | 'active' | 'upcoming';

export interface JourneyPhase {
  id: JourneyPhaseId;
  label: string;
  status: JourneyPhaseStatus;
}

export interface JourneyNextAction {
  label: string;
  sectionId: string;
}

export interface ClientJourneyInput {
  submission: PrepSubmission;
  consult30TranscriptLen: number;
  /** From getDocumentsBackend() on server or getDocumentsBackendForAdmin on client. */
  configuredBackend: DocumentsBackendMode;
}

export interface ClientJourneySnapshot {
  phases: JourneyPhase[];
  nextAction: JourneyNextAction | null;
  /** Resolved backend used for checkpoint evaluation (owned wins when owned docs exist). */
  documentsBackend: DocumentsBackendMode;
  checkpoints: {
    hasIntake: boolean;
    hasConsult: boolean;
    hasPricing: boolean;
    hasNda: boolean;
    hasProposal: boolean;
    hasAgreement: boolean;
    hasPortal: boolean;
    hasDeepDive: boolean;
    hasRetainerSigned: boolean;
  };
}

export type ClientListBadgeTone = 'success' | 'warning' | 'muted' | 'info';

export interface ClientListBadge {
  id: string;
  label: string;
  tone: ClientListBadgeTone;
}
