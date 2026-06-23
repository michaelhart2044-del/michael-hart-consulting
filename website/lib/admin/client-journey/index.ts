export type {
  ClientJourneyInput,
  ClientJourneySnapshot,
  ClientListBadge,
  ClientListBadgeTone,
  DocumentsBackendMode,
  JourneyNextAction,
  JourneyPhase,
  JourneyPhaseId,
  JourneyPhaseStatus,
} from '@/lib/admin/client-journey/types';

export {
  hasConsultProgress,
  isAgreementComplete,
  isNdaComplete,
  isNdaInProgress,
  isProposalComplete,
  isRetainerSigned,
  resolveDocumentsBackend,
} from '@/lib/admin/client-journey/checkpoints';

export { buildClientJourney, buildEngagementJourney } from '@/lib/admin/client-journey/build-journey';
export { buildClientListBadges } from '@/lib/admin/client-journey/list-badges';
export { JOURNEY_PHASE_SECTION_IDS } from '@/lib/admin/client-journey/phase-sections';
