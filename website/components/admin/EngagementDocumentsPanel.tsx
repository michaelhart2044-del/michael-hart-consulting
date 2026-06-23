'use client';

import { useEffect, useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';
import { getDocumentsBackendForAdmin } from '@/app/actions';
import PandaDocRetainerPanel from '@/components/admin/PandaDocRetainerPanel';
import OwnedDocumentsPanel from '@/components/admin/OwnedDocumentsPanel';

interface Props {
  submission: PrepSubmission;
  onUpdated: (submission: PrepSubmission) => void;
  onStatus: (message: string, isError?: boolean) => void;
}

export default function EngagementDocumentsPanel({ submission, onUpdated, onStatus }: Props) {
  const [backend, setBackend] = useState<'owned' | 'pandadoc' | null>(null);

  useEffect(() => {
    queueMicrotask(async () => {
      const res = await getDocumentsBackendForAdmin();
      if (res.success) setBackend(res.backend);
      else setBackend('pandadoc');
    });
  }, []);

  if (backend === null) {
    return (
      <section
        id="phase-documents"
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
      />
    );
  }

  return (
    <PandaDocRetainerPanel
      submission={submission}
      onUpdated={onUpdated}
      onStatus={onStatus}
    />
  );
}
