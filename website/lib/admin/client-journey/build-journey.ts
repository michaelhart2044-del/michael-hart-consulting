import {
  hasConsultProgress,
  isAgreementComplete,
  isNdaComplete,
  isNdaInProgress,
  isProposalComplete,
  isRetainerInProgress,
  isRetainerSigned,
  resolveDocumentsBackend,
} from '@/lib/admin/client-journey/checkpoints';
import type {
  ClientJourneyInput,
  ClientJourneySnapshot,
  JourneyNextAction,
  JourneyPhase,
  JourneyPhaseStatus,
} from '@/lib/admin/client-journey/types';

/** Canonical journey order — chips, checkpoints, and next-action all use this sequence. */
const JOURNEY_PHASES = [
  { id: 'intake' as const, label: 'Intake' },
  { id: 'consult' as const, label: 'Consult' },
  { id: 'pricing' as const, label: 'Pricing' },
  { id: 'nda' as const, label: 'NDA' },
  { id: 'proposal' as const, label: 'Proposal' },
  { id: 'agreement' as const, label: 'Agreement' },
  { id: 'portal' as const, label: 'Portal' },
  { id: 'delivery' as const, label: 'Deep dive' },
];

export function buildClientJourney(input: ClientJourneyInput): ClientJourneySnapshot {
  const { submission: sub, consult30TranscriptLen, configuredBackend } = input;
  const documentsBackend = resolveDocumentsBackend(sub, configuredBackend);

  const hasIntake = !!sub.createdAt;
  const hasConsult = hasConsultProgress(sub, consult30TranscriptLen);
  const hasPricing = !!sub.engagementQuote?.savedAt;
  const hasNda = isNdaComplete(sub, documentsBackend);
  const hasProposal = isProposalComplete(sub);
  const hasRetainerSigned = isRetainerSigned(sub, documentsBackend);
  const hasAgreement = isAgreementComplete(sub, documentsBackend);
  const hasPortal = !!sub.portalAccessGrantedAt && !sub.portalRevokedAt;
  const hasDeepDive = !!sub.comprehensiveBookedAt;

  const checkpointValues = [
    hasIntake,
    hasConsult,
    hasPricing,
    hasNda,
    hasProposal,
    hasAgreement,
    hasPortal,
    hasDeepDive,
  ];

  const firstIncomplete = checkpointValues.findIndex((done) => !done);

  function phaseStatus(index: number): JourneyPhaseStatus {
    if (!checkpointValues[index]) {
      return firstIncomplete === index ? 'active' : 'upcoming';
    }
    return 'complete';
  }

  const phases: JourneyPhase[] = JOURNEY_PHASES.map((phase, index) => ({
    ...phase,
    status: phaseStatus(index),
  }));

  const nextAction = buildNextAction({
    sub,
    consult30TranscriptLen,
    documentsBackend,
    hasIntake,
    hasConsult,
    hasPricing,
    hasNda,
    hasProposal,
    hasRetainerSigned,
    hasAgreement,
    hasPortal,
    hasDeepDive,
  });

  return {
    phases,
    nextAction,
    documentsBackend,
    checkpoints: {
      hasIntake,
      hasConsult,
      hasPricing,
      hasNda,
      hasProposal,
      hasAgreement,
      hasPortal,
      hasDeepDive,
      hasRetainerSigned,
    },
  };
}

function buildNextAction(ctx: {
  sub: ClientJourneyInput['submission'];
  consult30TranscriptLen: number;
  documentsBackend: ClientJourneyInput['configuredBackend'];
  hasIntake: boolean;
  hasConsult: boolean;
  hasPricing: boolean;
  hasNda: boolean;
  hasProposal: boolean;
  hasRetainerSigned: boolean;
  hasAgreement: boolean;
  hasPortal: boolean;
  hasDeepDive: boolean;
}): JourneyNextAction | null {
  const {
    sub,
    consult30TranscriptLen,
    documentsBackend,
    hasPricing,
    hasNda,
    hasProposal,
    hasRetainerSigned,
    hasAgreement,
    hasPortal,
    hasDeepDive,
  } = ctx;

  if (!ctx.hasIntake) {
    return { label: 'Waiting on intake form', sectionId: 'phase-intake' };
  }
  if (
    consult30TranscriptLen < 80 &&
    (sub.consult30Transcript?.trim().length ?? 0) < 80
  ) {
    return { label: 'Paste 30-min consult transcript', sectionId: 'phase-intake' };
  }
  if (!hasPricing) {
    return { label: 'Save engagement pricing quote', sectionId: 'phase-pricing' };
  }
  if (!hasNda) {
    const inProgress = isNdaInProgress(sub, documentsBackend);
    return inProgress
      ? {
          label: 'Finish NDA signing in SignWell',
          sectionId: 'phase-nda',
        }
      : { label: 'Generate mutual NDA', sectionId: 'phase-nda' };
  }
  if (!hasProposal) {
    return { label: 'Generate and send proposal', sectionId: 'phase-proposal' };
  }
  if (!hasAgreement) {
    if (!hasRetainerSigned) {
      const inProgress = isRetainerInProgress(sub, documentsBackend);
      return inProgress
        ? {
            label: 'Finish retainer signing in SignWell',
            sectionId: 'phase-agreement',
          }
        : { label: 'Generate activation retainer', sectionId: 'phase-agreement' };
    }
    return { label: 'Mark agreement signed & paid', sectionId: 'phase-portal' };
  }
  if (!hasPortal) {
    return { label: 'Grant portal access', sectionId: 'phase-portal' };
  }
  if (!hasDeepDive) {
    return { label: 'Client books 1-hour deep dive', sectionId: 'phase-intake' };
  }
  return null;
}

/** @deprecated Use buildClientJourney — kept for imports migrating off the old name. */
export function buildEngagementJourney(
  sub: ClientJourneyInput['submission'],
  consult30TranscriptLen: number,
  configuredBackend: ClientJourneyInput['configuredBackend'] = 'owned',
) {
  const snapshot = buildClientJourney({
    submission: sub,
    consult30TranscriptLen,
    configuredBackend,
  });
  return { phases: snapshot.phases, nextAction: snapshot.nextAction };
}
