import type { JourneyPhaseId } from '@/lib/admin/client-journey/types';

/** Scroll targets for journey phase chips in the admin hub. */
export const JOURNEY_PHASE_SECTION_IDS: Record<JourneyPhaseId, string> = {
  intake: 'phase-intake',
  consult: 'phase-intake',
  pricing: 'phase-pricing',
  nda: 'phase-nda',
  proposal: 'phase-proposal',
  agreement: 'phase-agreement',
  portal: 'phase-portal',
  delivery: 'phase-intake',
};
