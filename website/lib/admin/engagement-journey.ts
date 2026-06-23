import type { PrepSubmission } from '@/lib/submissions-store';

export type JourneyPhaseId =
  | 'intake'
  | 'consult'
  | 'pricing'
  | 'proposal'
  | 'nda'
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

function hasConsultProgress(sub: PrepSubmission, consult30Len: number): boolean {
  return !!sub.calendlyBookedAt || consult30Len >= 80 || (sub.consult30Transcript?.trim().length ?? 0) >= 80;
}

export function buildEngagementJourney(
  sub: PrepSubmission,
  consult30TranscriptLen: number,
): { phases: JourneyPhase[]; nextAction: JourneyNextAction | null } {
  const hasIntake = !!sub.createdAt;
  const hasConsult = hasConsultProgress(sub, consult30TranscriptLen);
  const hasPricing = !!sub.engagementQuote?.savedAt;
  const hasProposal = !!(sub.sentAt || (sub.proposalDraft && sub.proposalDraft.trim().length > 20));
  const hasNda = !!sub.pandadocNda || !!sub.ownedDocuments?.nda;
  const hasRetainer = !!sub.pandadocRetainer || !!sub.ownedDocuments?.retainer;
  const hasAgreement = !!sub.engagementCommittedAt || hasRetainer;
  const hasPortal = !!sub.portalAccessGrantedAt && !sub.portalRevokedAt;
  const hasDeepDive = !!sub.comprehensiveBookedAt;

  const checkpoints = [
    hasIntake,
    hasConsult,
    hasPricing,
    hasProposal,
    hasNda,
    hasAgreement,
    hasPortal,
    hasDeepDive,
  ];

  const firstIncomplete = checkpoints.findIndex((done) => !done);

  function phaseStatus(index: number): JourneyPhaseStatus {
    if (!checkpoints[index]) {
      return firstIncomplete === index ? 'active' : 'upcoming';
    }
    return 'complete';
  }

  const phases: JourneyPhase[] = [
    { id: 'intake', label: 'Intake', status: phaseStatus(0) },
    { id: 'consult', label: 'Consult', status: phaseStatus(1) },
    { id: 'pricing', label: 'Pricing', status: phaseStatus(2) },
    { id: 'proposal', label: 'Proposal', status: phaseStatus(3) },
    { id: 'nda', label: 'NDA', status: phaseStatus(4) },
    { id: 'agreement', label: 'Agreement', status: phaseStatus(5) },
    { id: 'portal', label: 'Portal', status: phaseStatus(6) },
    { id: 'delivery', label: 'Deep dive', status: phaseStatus(7) },
  ];

  let nextAction: JourneyNextAction | null = null;

  if (!hasIntake) {
    nextAction = { label: 'Waiting on intake form', sectionId: 'phase-intake' };
  } else if (consult30TranscriptLen < 80 && (sub.consult30Transcript?.trim().length ?? 0) < 80) {
    nextAction = { label: 'Paste 30-min consult transcript', sectionId: 'phase-intake' };
  } else if (!hasPricing) {
    nextAction = { label: 'Save engagement pricing quote', sectionId: 'phase-pricing' };
  } else if (!hasNda) {
    nextAction = { label: 'Generate mutual NDA', sectionId: 'phase-documents' };
  } else if (!hasProposal) {
    nextAction = { label: 'Generate and send proposal', sectionId: 'phase-proposal' };
  } else if (!hasRetainer) {
    nextAction = { label: 'Create activation retainer', sectionId: 'phase-documents' };
  } else if (!sub.engagementCommittedAt) {
    nextAction = { label: 'Mark agreement signed & paid', sectionId: 'phase-portal' };
  } else if (!hasPortal) {
    nextAction = { label: 'Grant portal access', sectionId: 'phase-portal' };
  } else if (!hasDeepDive) {
    nextAction = { label: 'Client books 1-hour deep dive', sectionId: 'phase-intake' };
  }

  return { phases, nextAction };
}
