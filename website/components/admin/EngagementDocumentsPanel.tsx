'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';
import { getDocumentsBackendForAdmin } from '@/app/actions';
import PandaDocRetainerPanel from '@/components/admin/PandaDocRetainerPanel';
import OwnedDocumentsPanel from '@/components/admin/OwnedDocumentsPanel';
import type { OwnedClientDetailsState } from '@/components/admin/owned-docs/use-owned-client-details';
import { resolveDocumentsBackend } from '@/lib/admin/client-journey';

export type OwnedDocumentsPart = 'nda' | 'agreement';

interface Props {
  submission: PrepSubmission;
  onUpdated: (submission: PrepSubmission) => void;
  onStatus: (message: string, isError?: boolean) => void;
  /** Split owned-doc workflow across the page (NDA → proposal → agreement). */
  part?: OwnedDocumentsPart;
  clientDetails?: OwnedClientDetailsState;
}

export default function EngagementDocumentsPanel({
  submission,
  onUpdated,
  onStatus,
  part,
  clientDetails,
}: Props) {
  const [configuredBackend, setConfiguredBackend] = useState<'owned' | 'pandadoc' | null>(null);

  useEffect(() => {
    queueMicrotask(async () => {
      const res = await getDocumentsBackendForAdmin();
      if (res.success) setConfiguredBackend(res.backend);
      else setConfiguredBackend('pandadoc');
    });
  }, []);

  const backend = useMemo(
    () =>
      configuredBackend
        ? resolveDocumentsBackend(submission, configuredBackend)
        : null,
    [submission, configuredBackend],
  );

  if (backend === null) {
    return (
      <section
        id={part === 'nda' ? 'phase-nda' : part === 'agreement' ? 'phase-agreement' : 'phase-documents'}
        className="border border-[#c5a46e]/40 rounded-2xl bg-[#0f172a] p-6 scroll-mt-24"
      >
        <div className="text-sm text-[#94a3b8]">Loading documents…</div>
      </section>
    );
  }

  if (backend === 'owned') {
    return (
      <OwnedDocumentsPanel
        submission={submission}
        onUpdated={onUpdated}
        onStatus={onStatus}
        part={part ?? 'full'}
        clientDetails={clientDetails}
      />
    );
  }

  if (part && part !== 'nda') {
    return null;
  }

  return (
    <PandaDocRetainerPanel
      submission={submission}
      onUpdated={onUpdated}
      onStatus={onStatus}
    />
  );
}
