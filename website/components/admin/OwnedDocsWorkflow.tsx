'use client';

import type { PrepSubmission } from '@/lib/submissions-store';
import EngagementDocumentsPanel from '@/components/admin/EngagementDocumentsPanel';
import { useOwnedClientDetails } from '@/components/admin/owned-docs/use-owned-client-details';

interface Props {
  submission: PrepSubmission;
  onUpdated: (submission: PrepSubmission) => void;
  onStatus: (message: string, isError?: boolean) => void;
  children: React.ReactNode;
}

/** Owned-doc path: NDA → children (proposal) → activation agreement. */
export default function OwnedDocsWorkflow({
  submission,
  onUpdated,
  onStatus,
  children,
}: Props) {
  const clientDetails = useOwnedClientDetails(submission);

  return (
    <>
      <EngagementDocumentsPanel
        key={`${submission.id}-nda`}
        submission={submission}
        onUpdated={onUpdated}
        onStatus={onStatus}
        part="nda"
        clientDetails={clientDetails}
      />
      {children}
      <EngagementDocumentsPanel
        key={`${submission.id}-agreement`}
        submission={submission}
        onUpdated={onUpdated}
        onStatus={onStatus}
        part="agreement"
        clientDetails={clientDetails}
      />
    </>
  );
}
