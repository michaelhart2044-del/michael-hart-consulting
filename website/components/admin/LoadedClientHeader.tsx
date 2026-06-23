'use client';

import { useEffect, useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';
import type { DocumentsBackendMode } from '@/lib/admin/client-journey';
import { getDocumentsBackendForAdmin } from '@/app/actions';
import {
  buildEngagementJourney,
  type JourneyPhase,
} from '@/lib/admin/engagement-journey';

interface Props {
  submission: PrepSubmission;
  consult30TranscriptLen: number;
  companyLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function phaseChipClass(phase: JourneyPhase): string {
  if (phase.status === 'complete') {
    return 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200';
  }
  if (phase.status === 'active') {
    return 'border-[#c5a46e]/50 bg-[#c5a46e]/10 text-[#e8d5b5]';
  }
  return 'border-white/10 bg-black/20 text-[#64748b]';
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LoadedClientHeader({
  submission,
  consult30TranscriptLen,
  companyLabel,
  onRefresh,
  refreshing,
}: Props) {
  const [documentsBackend, setDocumentsBackend] = useState<DocumentsBackendMode>('owned');

  useEffect(() => {
    queueMicrotask(async () => {
      const res = await getDocumentsBackendForAdmin();
      if (res.success) setDocumentsBackend(res.backend);
    });
  }, []);

  const { phases, nextAction } = buildEngagementJourney(
    submission,
    consult30TranscriptLen,
    documentsBackend,
  );

  const company =
    companyLabel?.trim() ||
    submission.clientCompany?.trim() ||
    submission.industry?.trim() ||
    '';

  return (
    <div className="sticky top-0 z-20 -mx-2 px-2 py-2 bg-[#0a0f2c]/95 backdrop-blur-md border-b border-[#c5a46e]/20">
      <div className="rounded-xl border border-[#c5a46e]/30 bg-[#0f172a] px-4 py-3 space-y-3 shadow-lg shadow-black/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Active client</div>
            <div className="font-semibold text-[#f1f5f9] mt-0.5">
              {submission.name}
              {company && (
                <span className="text-[#94a3b8] font-normal"> · {company}</span>
              )}
            </div>
            <div className="text-xs text-[#64748b]">{submission.email}</div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            {nextAction && (
              <button
                type="button"
                onClick={() => scrollToSection(nextAction.sectionId)}
                className="text-left sm:text-right group"
              >
                <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Next action</div>
                <div className="text-sm font-medium text-[#c5a46e] group-hover:text-[#e8d5b5] transition-colors">
                  {nextAction.label} →
                </div>
              </button>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-[#cbd5e1] hover:bg-white/5 disabled:opacity-40 self-start sm:self-center"
              >
                {refreshing ? 'Refreshing…' : 'Refresh status'}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {phases.map((phase) => (
            <span
              key={phase.id}
              className={`text-[10px] px-2 py-0.5 rounded-full border ${phaseChipClass(phase)}`}
            >
              {phase.status === 'complete' ? '✓ ' : ''}
              {phase.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
