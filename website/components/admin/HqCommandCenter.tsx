'use client';

import { useMemo, useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';
import { buildClientJourney } from '@/lib/admin/client-journey/build-journey';
import { getHqRegistry, getHqProjectsByTier } from '@/lib/hq/registry';
import type { HqProject } from '@/lib/hq/types';

interface RecentSummary {
  total: number;
  withPortal: number;
  withAgreement: number;
}

interface Props {
  recent: RecentSummary;
  loadedSub?: PrepSubmission | null;
  consult30TranscriptLen?: number;
  configuredBackend?: 'owned' | 'pandadoc' | null;
}

function copyText(text: string, onDone: () => void) {
  navigator.clipboard.writeText(text).then(onDone).catch(() => {});
}

function ProjectCard({ project }: { project: HqProject }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4 flex flex-col gap-2 h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-2xl leading-none" aria-hidden>
            {project.emoji}
          </span>
          <h3 className="font-semibold text-[#f1f5f9] mt-2">{project.name}</h3>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            project.status === 'active'
              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30'
              : 'border-amber-500/40 text-amber-200 bg-amber-950/20'
          }`}
        >
          {project.status}
        </span>
      </div>
      <p className="text-xs text-[#94a3b8] leading-relaxed flex-1">{project.purpose}</p>
      {project.formerNames?.length ? (
        <p className="text-[10px] text-[#64748b]">Formerly: {project.formerNames.join(', ')}</p>
      ) : null}
      <div className="font-mono text-[10px] text-[#c5a46e]/90 bg-black/40 rounded-lg px-2 py-1.5 break-all">
        {project.path}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() =>
            copyText(project.path, () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
          }
          className="text-xs px-3 py-1 rounded-full border border-white/15 hover:bg-white/5"
        >
          {copied ? 'Copied' : 'Copy path'}
        </button>
        {project.repo ? (
          <a
            href={`https://${project.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1 rounded-full border border-[#c5a46e]/40 text-[#c5a46e] hover:bg-[#c5a46e]/10"
          >
            GitHub
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function HqCommandCenter({
  recent,
  loadedSub,
  consult30TranscriptLen = 0,
  configuredBackend = null,
}: Props) {
  const registry = getHqRegistry();
  const core = getHqProjectsByTier('core');
  const ventures = getHqProjectsByTier('venture');

  const nextAction = useMemo(() => {
    if (!loadedSub || !configuredBackend) return null;
    return buildClientJourney({
      submission: loadedSub,
      consult30TranscriptLen,
      configuredBackend,
    }).nextAction;
  }, [loadedSub, consult30TranscriptLen, configuredBackend]);

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section
      id="hq-command-center"
      className="border border-[#c5a46e]/50 rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#0f172a] to-[#1a2332] p-6 space-y-6 scroll-mt-24"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-[#c5a46e]">Business HQ</div>
          <h2 className="text-2xl font-semibold tracking-tight mt-0.5">Command Center</h2>
          <p className="text-sm text-[#94a3b8] mt-1 max-w-2xl">
            Single view of Core consulting tools, Venture product lines, and pre-launch readiness.
            Registry updated {registry.updated}.
          </p>
        </div>
        <div className="text-xs text-[#64748b] font-mono truncate max-w-full">
          {registry.businessRoot}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Intake records</div>
          <div className="text-2xl font-semibold text-[#f1f5f9] mt-1">{recent.total}</div>
          <div className="text-xs text-[#94a3b8] mt-1">In admin dossier (incl. tests)</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Agreements marked</div>
          <div className="text-2xl font-semibold text-[#f1f5f9] mt-1">{recent.withAgreement}</div>
          <div className="text-xs text-[#94a3b8] mt-1">Step 8 complete</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Portal active</div>
          <div className="text-2xl font-semibold text-[#f1f5f9] mt-1">{recent.withPortal}</div>
          <div className="text-xs text-[#94a3b8] mt-1">Access granted</div>
        </div>
      </div>

      {loadedSub && nextAction ? (
        <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-sky-300/80">Loaded client — next action</div>
            <div className="font-medium text-[#f1f5f9] mt-1">
              {loadedSub.name} · {nextAction.label}
            </div>
          </div>
          <button
            type="button"
            onClick={() => scrollToSection(nextAction.sectionId)}
            className="text-xs px-4 py-2 rounded-full bg-sky-600/80 hover:bg-sky-500 text-white font-medium shrink-0"
          >
            Go to step
          </button>
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-[#c5a46e] mb-3">Core — Consulting Practice</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {core.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-violet-300 mb-1">Ventures — Product Lines</h3>
        <p className="text-xs text-[#64748b] mb-3">Future projects register here — separate from consulting Core.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {ventures.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>

      {registry.externalLinks?.length ? (
        <div>
          <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">External tools</h3>
          <div className="flex flex-wrap gap-2">
            {registry.externalLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-[#c5a46e]/50 hover:bg-white/5"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {registry.preLaunchChecklist?.length ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/10 p-4">
          <h3 className="text-sm font-semibold text-amber-200 mb-3">Pre-launch checklist</h3>
          <ul className="space-y-2 text-sm">
            {registry.preLaunchChecklist.map((item) => (
              <li key={item.id} className="flex gap-2 text-[#e2e8f0]">
                <span className="text-amber-400/80">○</span>
                <span>
                  {item.label}
                  {item.hint ? (
                    <span className="block text-xs text-[#64748b] mt-0.5">{item.hint}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[#64748b] mt-3">
            Test phase — no live income yet. Check items off in QBO / Business HQ as you complete them.
          </p>
        </div>
      ) : null}
    </section>
  );
}
