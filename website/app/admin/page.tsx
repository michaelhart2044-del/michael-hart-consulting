'use client';

import { useState, useEffect } from 'react';
import {
  getRecentPrepsForAdmin,
  loadPrepForAdmin,
  sendProposalToClientForAdmin,
  markPrepAsSent,
  saveProposalDraftForAdmin,
  generateInitialProposal,
  markEngagementCommittedForAdmin,
  grantPortalAccessForAdmin,
  resendPortalAccessForAdmin,
  revokePortalAccessForAdmin,
  deleteClientForAdmin,
  saveConsultTranscriptsForAdmin,
  getProposalAiStatusForAdmin,
  logoutAdmin,
} from '@/app/actions';
import type { PrepSubmission } from '@/lib/submissions-store';
import ClientEvidenceTimeline from '@/components/admin/ClientEvidenceTimeline';
import LoadedClientHeader from '@/components/admin/LoadedClientHeader';
import EngagementEconomicsPanel from '@/components/admin/EngagementEconomicsPanel';
import EngagementDocumentsPanel from '@/components/admin/EngagementDocumentsPanel';
import CalendlyIntegrationPanel from '@/components/admin/CalendlyIntegrationPanel';
import { ADMIN_PORTAL_DISABLED_UNTIL_STEP8, ADMIN_STEP89_INSTRUCTION } from '@/lib/portal-client-copy';
import { site } from '@/lib/site';
import { effectiveQuoteFees, formatUsd } from '@/lib/engagement-pricing';

interface RecentItem {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  industry: string;
  mainChallenge: string;
  sentAt?: string;
  engagementCommittedAt?: string;
  portalAccessGrantedAt?: string;
  mustChangePassword?: boolean;
  portalRevokedAt?: string;
  calendlyBookedAt?: string;
  comprehensiveBookedAt?: string;
  calendly30CanceledAt?: string;
  comprehensiveCanceledAt?: string;
}

interface Generated {
  defineSection: string;
  pitchSection: string;
  fullProposal: string;
}

export default function AdminProposalGenerator() {
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadedSub, setLoadedSub] = useState<PrepSubmission | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<Generated | null>(null);
  const [outputText, setOutputText] = useState(''); // editable full text
  const [status, setStatus] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [isGrantingPortal, setIsGrantingPortal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [consult30Transcript, setConsult30Transcript] = useState('');
  const [consult60Transcript, setConsult60Transcript] = useState('');
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [layer3Status, setLayer3Status] = useState('');
  const [layer3StatusIsError, setLayer3StatusIsError] = useState(false);

  function showLayer3Status(message: string, isError = false) {
    setLayer3Status(message);
    setLayer3StatusIsError(isError);
    showStatus(message, isError, isError ? 15000 : 8000);
  }

  function getGenerateBlockers(): string[] {
    const blockers: string[] = [];
    if (!loadedSub) {
      blockers.push('Load a client from Recent Prep Submissions.');
      return blockers;
    }
    const transcriptLen = consult30Transcript.trim().length;
    if (transcriptLen < 80) {
      blockers.push(
        transcriptLen === 0
          ? 'Paste the 30-min transcript in Phase 1 (Engagement Timeline) — not the optional “Supplemental notes” box below.'
          : `30-min transcript is too short (${transcriptLen} of 80 characters minimum). Use the Phase 1 consult field above Engagement Economics.`,
      );
    }
    if (!loadedSub.engagementQuote?.savedAt) {
      blockers.push('Optional: save engagement quote in Engagement Economics for internal pricing (not included in initial proposal).');
    }
    if (aiConfigured === false) {
      blockers.push('XAI_API_KEY is not set in Vercel — Grok cannot run until the key is added and redeployed.');
    }
    return blockers;
  }

  const generateBlockers = loadedSub ? getGenerateBlockers().filter((b) => !b.startsWith('Optional:')) : ['Load a client from Recent Prep Submissions.'];
  const canGenerate = generateBlockers.length === 0 && !isGenerating;

  function showStatus(message: string, isError = false, ms = isError ? 12000 : 5000) {
    setStatus(message);
    setStatusIsError(isError);
    setTimeout(() => {
      setStatus('');
      setStatusIsError(false);
    }, ms);
  }

  // Load recent on mount
  async function refreshRecent() {
    setLoadingRecent(true);
    const res = await getRecentPrepsForAdmin();
    if (res.success) {
      setRecent(res.items as RecentItem[]);
    } else {
      setStatus(res.error || 'Failed to load recent submissions');
    }
    setLoadingRecent(false);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void refreshRecent();
      void getProposalAiStatusForAdmin().then((res) => {
        if (res.success) setAiConfigured(!!res.configured);
      });
    });
  }, []);

  async function handleLoad(id: string) {
    setStatus('');
    const res = await loadPrepForAdmin(id);
    if (!res.success || !res.submission) {
      setStatus(res.error || 'Could not load submission');
      return;
    }
    const sub = res.submission as PrepSubmission;
    setLoadedSub(sub);
    setConsult30Transcript(sub.consult30Transcript || '');
    setConsult60Transcript(sub.consult60Transcript || '');
    setTranscript('');
    // Clear any prior generated output so user can re-generate with fresh data
    setProposal(null);
    setOutputText('');
    setStatus(`Loaded: ${sub.name} (${new Date(sub.createdAt).toLocaleDateString()})`);
  }

  async function handleSaveConsultTranscripts() {
    if (!loadedSub) return;

    const res = await saveConsultTranscriptsForAdmin(
      loadedSub.id,
      consult30Transcript,
      consult60Transcript,
    );
    if (res.success && res.submission) {
      setLoadedSub(res.submission as PrepSubmission);
      setStatus('Consult transcripts saved.');
    } else {
      setStatus(res.error || 'Failed to save transcripts');
    }
    setTimeout(() => setStatus(''), 2500);
  }

  async function handleGenerate() {
    if (!loadedSub) {
      showLayer3Status('Load a client first.', true);
      return;
    }

    const blockers = getGenerateBlockers();
    if (blockers.length > 0) {
      showLayer3Status(blockers.join(' '), true);
      return;
    }

    setIsGenerating(true);
    setLayer3Status('Calling Grok — this usually takes 15–45 seconds…');
    setLayer3StatusIsError(false);
    setStatus('');

    const input = {
      name: loadedSub.name || 'Client',
      industry: loadedSub.industry || '',
      mainChallenge: loadedSub.mainChallenge || '',
      additionalChallenges: loadedSub.additionalChallenges || [],
      peopleInvolved: loadedSub.peopleInvolved || '',
      successLooksLike: loadedSub.successLooksLike || '',
      additionalContext: loadedSub.additionalContext || '',
      consult30Transcript: consult30Transcript || loadedSub.consult30Transcript || '',
      transcript: transcript.trim() || undefined,
    };

    try {
      const res = await generateInitialProposal(loadedSub.id, input);
      if (res.success && res.proposal) {
        const p = res.proposal as Generated;
        setProposal(p);
        setOutputText(p.fullProposal);
        showLayer3Status('Proposal generated — scope and approach only (no fees). Review the full text below.');
      } else {
        showLayer3Status(res.error || 'Generation failed', true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error — check your connection and try again.';
      showLayer3Status(message, true);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleLogout() {
    await logoutAdmin();
    window.location.href = '/admin/login';
  }

  async function copyAll() {
    const text = outputText || (proposal ? proposal.fullProposal : '');
    if (!text) {
      setStatus('Nothing to copy — generate a proposal first');
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied to clipboard');
      setTimeout(() => setStatus(''), 1800);
    } catch {
      setStatus('Copy blocked — please select the text and copy manually');
      setTimeout(() => setStatus(''), 3000);
    }
  }

  function downloadTxt() {
    const text = outputText || (proposal ? proposal.fullProposal : '');
    if (!text) {
      setStatus('Nothing to download — generate a proposal first');
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${(loadedSub?.name || 'client').replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Downloaded as .txt');
    setTimeout(() => setStatus(''), 1600);
  }

  function printToPdf() {
    const text = outputText || (proposal ? proposal.fullProposal : '');
    if (!text) {
      setStatus('Nothing to print — generate a proposal first');
      setTimeout(() => setStatus(''), 2000);
      return;
    }

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      setStatus('Pop-up blocked — please allow pop-ups or use Download .txt instead');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    // Nicer printable layout with sections
    const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    w.document.write(`
      <html>
        <head>
          <title>Proposal — ${(loadedSub?.name || 'Client')}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 40px; color: #111; max-width: 860px; margin: 0 auto; font-size: 14px; }
            pre { white-space: pre-wrap; font-family: ui-monospace, monospace; background: #f8f8f8; padding: 16px; border-radius: 6px; }
            h1 { font-size: 20px; margin: 0 0 12px; }
            .meta { color: #555; font-size: 12px; margin-bottom: 24px; }
          </style>
        </head>
        <body>
          <h1>Proposal for ${(loadedSub?.name || 'Client')}</h1>
          <div class="meta">Generated privately • Michael Hart Consulting • ${new Date().toLocaleDateString()}</div>
          <pre>${safeText}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
    setStatus('Print dialog opened (choose Save as PDF)');
    setTimeout(() => setStatus(''), 2200);
  }

  function buildClientEmailBody(greeting: string): string {
    return `Hi ${greeting},

Thank you for our conversation. I've attached the initial proposal outlining our recommended path forward based on what you shared.

Please review at your convenience and let me know if you have any questions — or if you'd like to schedule a brief follow-up to walk through scope and timing together.

Best regards,`;
  }

  async function generateEmailDraft() {
    const text = outputText || (proposal ? proposal.fullProposal : '');
    if (!text) {
      setStatus('Generate a proposal first to create an email draft');
      setTimeout(() => setStatus(''), 2200);
      return;
    }

    const clientName = loadedSub?.name || 'Client';
    const subject = `Initial Proposal — ${clientName}`;
    const greeting = loadedSub?.name?.split(' ')[0] || 'there';

    const emailBody = buildClientEmailBody(greeting);
    const mailto = `mailto:${encodeURIComponent(loadedSub?.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    // Open mailto (best-effort; some browsers block or truncate)
    try {
      const link = document.createElement('a');
      link.href = mailto;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setStatus('Could not open email client — copy the body manually if needed.');
    }

    setStatus('Outlook opened — attach your proposal PDF, then send.');
    setTimeout(() => setStatus(''), 4000);
  }

  async function handleSaveDraft() {
    if (!loadedSub || !outputText) {
      setStatus('Load a submission and generate (or paste) a proposal first');
      return;
    }
    const res = await saveProposalDraftForAdmin(loadedSub.id, outputText);
    setStatus(res.success ? 'Draft saved to this submission record' : (res.error || 'Failed to save draft'));
    setTimeout(() => setStatus(''), 2200);
  }

  async function handleMarkStep8(submissionId?: string) {
    const id = submissionId || loadedSub?.id;
    if (!id) {
      setStatus('Load a submission first');
      return;
    }
    setBusyId(id);
    setStatus('');
    const res = await markEngagementCommittedForAdmin(id);
    if (res.success) {
      setStatus(res.message || 'Agreement & payment recorded.');
      if (loadedSub?.id === id) {
        setLoadedSub({
          ...loadedSub,
          engagementCommittedAt: res.engagementCommittedAt || new Date().toISOString(),
        });
      }
      await refreshRecent();
    } else {
      setStatus(res.error || 'Failed to mark agreement & payment');
    }
    setBusyId(null);
    setTimeout(() => setStatus(''), 4000);
  }

  async function handleGrantPortalAccess(submissionId?: string) {
    const id = submissionId || loadedSub?.id;
    if (!id) {
      setStatus('Load a submission first');
      return;
    }
    if (isGrantingPortal || busyId === id) return;

    setBusyId(id);
    setIsGrantingPortal(true);
    setStatus('');
    const res = await grantPortalAccessForAdmin(id);
    if (res.success) {
      setStatus(res.message || 'Portal access granted.');
      const grantedAt = res.portalAccessGrantedAt || new Date().toISOString();
      if (loadedSub?.id === id) {
        setLoadedSub({
          ...loadedSub,
          portalAccessGrantedAt: grantedAt,
          mustChangePassword: true,
        });
      }
      await refreshRecent();
    } else {
      setStatus(res.error || 'Failed to grant portal access');
      if (loadedSub?.id === id && res.portalAccessGrantedAt) {
        setLoadedSub({
          ...loadedSub,
          portalAccessGrantedAt: res.portalAccessGrantedAt,
          mustChangePassword: true,
        });
      }
    }
    setIsGrantingPortal(false);
    setBusyId(null);
    setTimeout(() => setStatus(''), 5000);
  }

  async function handleResendPortalAccess(submissionId?: string) {
    const id = submissionId || loadedSub?.id;
    if (!id) return;
    setBusyId(id);
    setIsGrantingPortal(true);
    setStatus('');
    const res = await resendPortalAccessForAdmin(id);
    if (res.success) {
      setStatus(res.message || 'Portal access email resent.');
      if (loadedSub?.id === id) {
        setLoadedSub({ ...loadedSub, mustChangePassword: true });
      }
      await refreshRecent();
    } else {
      setStatus(res.error || 'Failed to resend portal access');
    }
    setIsGrantingPortal(false);
    setBusyId(null);
    setTimeout(() => setStatus(''), 5000);
  }

  async function handleRevokePortalAccess(submissionId?: string) {
    const id = submissionId || loadedSub?.id;
    if (!id) return;

    const name = loadedSub?.id === id ? loadedSub.name : recent.find((r) => r.id === id)?.name || 'this client';
    if (!window.confirm(`Revoke portal access for ${name}?\n\nThey will immediately lose sign-in access. Their intake record is kept so you can re-grant access later.`)) {
      return;
    }

    setBusyId(id);
    setStatus('');
    const res = await revokePortalAccessForAdmin(id);
    if (res.success) {
      setStatus(res.message || 'Portal access revoked.');
      if (loadedSub?.id === id) {
        setLoadedSub({
          ...loadedSub,
          portalAccessGrantedAt: undefined,
          portalPasswordHash: undefined,
          mustChangePassword: undefined,
          portalRevokedAt: res.portalRevokedAt || new Date().toISOString(),
        });
      }
      await refreshRecent();
    } else {
      setStatus(res.error || 'Failed to revoke portal access');
    }
    setBusyId(null);
    setTimeout(() => setStatus(''), 6000);
  }

  async function handleDeleteClient(submissionId?: string) {
    const id = submissionId || loadedSub?.id;
    if (!id) return;

    const target = loadedSub?.id === id ? loadedSub : recent.find((r) => r.id === id);
    const label = target ? `${target.name} (${target.email})` : 'this client';
    if (!window.confirm(`Permanently delete all records for ${label}?\n\nThis removes their intake, portal history, and proposal drafts. This cannot be undone.`)) {
      return;
    }

    setBusyId(id);
    setStatus('');
    const res = await deleteClientForAdmin(id);
    if (res.success) {
      setStatus(res.message || 'Client record deleted.');
      if (loadedSub?.id === id) {
        setLoadedSub(null);
        setProposal(null);
        setOutputText('');
        setTranscript('');
        setConsult30Transcript('');
        setConsult60Transcript('');
      }
      await refreshRecent();
    } else {
      setStatus(res.error || 'Failed to delete client');
    }
    setBusyId(null);
    setTimeout(() => setStatus(''), 6000);
  }

  async function handleSendProposalToClient() {
    if (!loadedSub) {
      setStatus('Load a submission first');
      return;
    }
    const text = outputText || (proposal ? proposal.fullProposal : '');
    if (!text.trim()) {
      setStatus('Generate a proposal first');
      setTimeout(() => setStatus(''), 2200);
      return;
    }
    if (!confirm(`Send proposal to ${loadedSub.name} at ${loadedSub.email}?`)) return;

    setIsSendingProposal(true);
    setStatus('');
    const res = await sendProposalToClientForAdmin(loadedSub.id, text);
    setIsSendingProposal(false);

    if (res.success) {
      showStatus(res.message || 'Proposal sent.');
      setLoadedSub({ ...loadedSub, sentAt: res.sentAt || new Date().toISOString() });
      await refreshRecent();
    } else {
      showStatus(res.error || 'Failed to send proposal', true);
    }
  }

  async function handleMarkSent() {
    if (!loadedSub) {
      setStatus('Load a submission first');
      return;
    }
    const res = await markPrepAsSent(loadedSub.id);
    if (res.success) {
      setStatus('Marked as sent — Phase 4 complete.');
      // refresh the recent list so the flag appears
      await refreshRecent();
      // update local loaded state
      setLoadedSub({ ...loadedSub, sentAt: new Date().toISOString() });
    } else {
      setStatus(res.error || 'Failed to mark sent');
    }
    setTimeout(() => setStatus(''), 2200);
  }

  async function copyForSigVai() {
    try {
      const name = loadedSub?.name || 'Unknown Client';
      const email = loadedSub?.email || '';
      const industry = loadedSub?.industry || 'Not specified';
      const mainChallenge = loadedSub?.mainChallenge || 'Not specified';
      const additionalChallenges = (loadedSub?.additionalChallenges || []).join(', ') || 'None';
      const peopleInvolved = loadedSub?.peopleInvolved || 'Not specified';
      const successLooksLike = loadedSub?.successLooksLike || 'Not specified';
      const additionalContext = loadedSub?.additionalContext || 'None';

      const notes = transcript.trim() || loadedSub?.fullText || 'No additional notes or transcript provided.';

      let formatted = `=== SIGVAI INPUT - READY TO PASTE ===\n\n`;
      formatted += `Client: ${name}${email ? ` <${email}>` : ''}\n`;
      formatted += `Industry / Business Type: ${industry}\n`;
      formatted += `Main Challenge: ${mainChallenge}\n`;
      formatted += `Additional Challenges: ${additionalChallenges}\n`;
      formatted += `Team size & effort (people involved): ${peopleInvolved}\n`;
      formatted += `What success looks like (30-90 days): ${successLooksLike}\n`;
      formatted += `Additional context / deadlines: ${additionalContext}\n\n`;
      formatted += `Additional notes / transcript:\n${notes}\n\n`;
      formatted += `=== END SIGVAI INPUT ===`;

      await navigator.clipboard.writeText(formatted);
      setStatus('✅ Data copied for SigVai — paste it into your SigVai tool now');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error('Copy for SigVai error:', err);
      setStatus('Failed to copy to clipboard. Check browser console for details.');
      setTimeout(() => setStatus(''), 4000);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-1px]">Engagement Hub</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Intake → consult → proposal → portal → SigVai
            {aiConfigured === false && (
              <span className="block text-amber-300/90 mt-1">
                Add XAI_API_KEY in Vercel to enable AI proposal generation.
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-1.5 rounded-full border border-white/20 hover:bg-white/5"
        >
          Sign out
        </button>
      </div>

      {status && (
        <div
          className={`text-sm px-4 py-2 rounded-lg border ${
            statusIsError
              ? 'bg-red-950/40 border-red-500/40 text-red-200'
              : 'bg-white/5 border-white/10 text-[#c5a46e]'
          }`}
        >
          {status}
        </div>
      )}

      {/* Recent Prep Submissions */}
      <section className="border border-white/10 rounded-2xl bg-[#0f172a] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent Prep Submissions</h2>
          <button
            onClick={refreshRecent}
            disabled={loadingRecent}
            className="text-xs px-3 py-1 rounded border border-white/20 hover:bg-white/5 disabled:opacity-50"
          >
            {loadingRecent ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {recent.length > 0 && (() => {
          const byEmail = new Map<string, number>();
          recent.forEach((item) => {
            const key = item.email.toLowerCase();
            byEmail.set(key, (byEmail.get(key) || 0) + 1);
          });
          const dupes = [...byEmail.entries()].filter(([, n]) => n > 1);
          if (dupes.length === 0) return null;
          return (
            <div className="mb-4 p-3 rounded-lg border border-amber-500/40 bg-amber-950/20 text-xs text-amber-100">
              <strong>Duplicate emails detected.</strong> Multiple intake records share the same address.
              Portal sign-in uses the record with active portal access — delete extra test duplicates to avoid confusion.
            </div>
          );
        })()}

        {recent.length === 0 && !loadingRecent && (
          <div className="text-sm text-[#94a3b8] space-y-2">
            <p>No submissions yet.</p>
            <p>
              When a client completes the intake at{' '}
              <a href="/prepare-analysis" className="text-[#c5a46e] underline" target="_blank" rel="noreferrer">
                /prepare-analysis
              </a>
              , click Refresh to see them here.
            </p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {recent.map((item) => (
            <div key={item.id} className="border border-white/10 rounded-xl p-4 flex flex-col gap-2 text-sm">
              <div className="font-medium">{item.name} <span className="text-[#64748b]">• {item.email}</span></div>
              <div className="text-[#94a3b8] text-xs">
                {item.industry} — {item.mainChallenge?.slice(0, 70)}{item.mainChallenge?.length > 70 ? '…' : ''}
              </div>
              <div className="text-[11px] text-[#64748b] flex flex-wrap items-center gap-2">
                {new Date(item.createdAt).toLocaleString()}
                {!item.calendlyBookedAt && item.calendly30CanceledAt && (
                  <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 text-[10px]">BOOKING CANCELED</span>
                )}
                {!item.calendlyBookedAt && !item.calendly30CanceledAt && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 text-[10px]">BOOKING PENDING</span>
                )}
                {item.calendlyBookedAt && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-[10px]">CONSULT BOOKED</span>
                )}
                {item.comprehensiveBookedAt && (
                  <span className="px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-300 text-[10px]">1-HR BOOKED</span>
                )}
                {!item.comprehensiveBookedAt && item.comprehensiveCanceledAt && (
                  <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 text-[10px]">1-HR CANCELED</span>
                )}
                {item.sentAt && <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-[10px]">SENT</span>}
                {item.engagementCommittedAt && <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 text-[10px]">AGREEMENT</span>}
                {item.portalAccessGrantedAt && item.mustChangePassword !== false && (
                  <span className="px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-300 text-[10px]">PORTAL — AWAITING LOGIN</span>
                )}
                {item.portalAccessGrantedAt && item.mustChangePassword === false && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 text-[10px]">PORTAL ACTIVE</span>
                )}
                {item.portalRevokedAt && !item.portalAccessGrantedAt && (
                  <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 text-[10px]">PORTAL REVOKED</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <button
                  onClick={() => handleLoad(item.id)}
                  className="text-xs px-4 py-1.5 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black rounded-full font-medium"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteClient(item.id)}
                  disabled={busyId === item.id}
                  className="text-xs px-3 py-1.5 rounded-full border border-red-500/30 text-red-300/80 hover:bg-red-900/10 disabled:opacity-50"
                >
                  {busyId === item.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {loadedSub && (
        <LoadedClientHeader
          submission={loadedSub}
          consult30TranscriptLen={consult30Transcript.trim().length}
        />
      )}

      {loadedSub && (
        <ClientEvidenceTimeline
          submission={loadedSub}
          consult30Transcript={consult30Transcript}
          onConsult30TranscriptChange={setConsult30Transcript}
          consult60Transcript={consult60Transcript}
          onConsult60TranscriptChange={setConsult60Transcript}
          onSaveTranscripts={handleSaveConsultTranscripts}
        />
      )}

      {loadedSub && (
        <EngagementEconomicsPanel
          key={loadedSub.id}
          submission={loadedSub}
          consult30Transcript={consult30Transcript}
          onSaved={(sub) => setLoadedSub(sub)}
          onStatus={(message, isError) => showStatus(message, isError)}
        />
      )}

      {loadedSub && (
        <EngagementDocumentsPanel
          key={loadedSub.id}
          submission={loadedSub}
          onUpdated={(sub) => setLoadedSub(sub)}
          onStatus={(message, isError) => showStatus(message, isError)}
        />
      )}

      {/* Phase 4 — Initial proposal */}
      {loadedSub && (
      <section id="phase-proposal" className="border border-[#c5a46e]/40 rounded-2xl bg-[#0f172a] p-6 space-y-6 scroll-mt-24">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Phase 4 — Proposal</div>
          <h2 className="font-semibold text-lg mt-0.5">Initial Proposal</h2>
          <p className="text-sm text-[#94a3b8] mt-1">
            After the 30-min call: generate with Grok → review → email client. Initial proposals are scope-only — no fees (pricing comes at agreement).
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#94a3b8]">
          Client-facing PDFs at this stage include <span className="text-[#e2e8f0]">DEFINE</span> and{' '}
          <span className="text-[#e2e8f0]">RECOMMENDED APPROACH</span> only. Engagement Economics above stays internal until agreement.
        </div>

        {loadedSub?.engagementQuote?.savedAt && (
          <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-xs text-[#64748b]">
            Internal quote on file: {formatUsd(effectiveQuoteFees(loadedSub.engagementQuote).activationFee)} activation →{' '}
            {formatUsd(effectiveQuoteFees(loadedSub.engagementQuote).totalFee)} total — not included in this PDF.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-[#cbd5e1]">Supplemental notes (optional)</label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            className="w-full bg-[#111827] border border-white/20 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#c5a46e] placeholder:text-[#64748b]"
            placeholder="Optional — e.g. follow-up email context. Primary source is the Phase 1 consult transcript."
          />
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-[#64748b]">Before you generate</div>
          <ul className="text-sm space-y-1">
            <li className={loadedSub ? 'text-emerald-300' : 'text-amber-200'}>
              {loadedSub ? '✓' : '○'} Client loaded
            </li>
            <li className={consult30Transcript.trim().length >= 80 ? 'text-emerald-300' : 'text-amber-200'}>
              {consult30Transcript.trim().length >= 80 ? '✓' : '○'} 30-min transcript in Phase 1 (
              {consult30Transcript.trim().length}/80 chars)
            </li>
            <li className={loadedSub?.engagementQuote?.savedAt ? 'text-emerald-300' : 'text-[#64748b]'}>
              {loadedSub?.engagementQuote?.savedAt ? '✓' : '○'} Internal quote saved (optional)
            </li>
            <li className={aiConfigured !== false ? 'text-emerald-300' : 'text-amber-200'}>
              {aiConfigured !== false ? '✓' : '○'} Grok API key configured
            </li>
          </ul>
          {generateBlockers.length > 0 && (
            <p className="text-xs text-amber-100/90 pt-1 border-t border-white/10">
              {generateBlockers.join(' ')}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={!canGenerate}
            className="px-8 py-3.5 text-base font-semibold bg-[#8f6f3d] hover:bg-[#b89a6e] text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.985]"
          >
            {isGenerating ? 'Generating with Grok… (please wait)' : '1. Generate Initial Proposal (Grok)'}
          </button>
          <button
            type="button"
            onClick={copyForSigVai}
            className="px-6 py-3 text-sm font-medium rounded-full border border-white/20 text-[#94a3b8] hover:bg-white/5 hover:text-[#e2e8f0]"
          >
            Copy intake for SigVai (optional)
          </button>
        </div>

        {layer3Status && (
          <div
            className={`text-sm px-4 py-3 rounded-lg border ${
              layer3StatusIsError
                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-100'
            }`}
          >
            {layer3Status}
          </div>
        )}

        {(proposal || outputText) && (
          <div className="space-y-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold">Generated proposal — edit before sending</h3>
              <span className="text-xs text-[#64748b]">Save Draft stores on this client record</span>
            </div>

            {proposal && (
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="border border-white/10 rounded-xl p-4 bg-black/20">
                  <div className="uppercase tracking-[1px] text-[10px] text-[#c5a46e] mb-2">DEFINE</div>
                  <pre className="whitespace-pre-wrap text-[#cbd5e1] text-[12.5px] leading-relaxed font-mono">{proposal.defineSection}</pre>
                </div>
                <div className="border border-white/10 rounded-xl p-4 bg-black/20">
                  <div className="uppercase tracking-[1px] text-[10px] text-[#c5a46e] mb-2">Recommended approach</div>
                  <pre className="whitespace-pre-wrap text-[#cbd5e1] text-[12.5px] leading-relaxed font-mono">{proposal.pitchSection}</pre>
                </div>
              </div>
            )}

            <div>
              <div className="text-xs uppercase tracking-widest text-[#94a3b8] mb-1.5">Full editable text</div>
              <textarea
                value={outputText}
                onChange={(e) => setOutputText(e.target.value)}
                rows={18}
                className="w-full font-mono text-sm bg-[#111827] border border-white/20 rounded-xl p-4 focus:outline-none focus:border-[#c5a46e] leading-relaxed"
              />
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 space-y-3">
              <p className="text-xs font-medium text-[#c5a46e]">2. Deliver to client</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void handleSendProposalToClient()}
                  disabled={!outputText || isSendingProposal}
                  className="px-6 py-2.5 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-40"
                >
                  {isSendingProposal ? 'Sending…' : 'Send proposal to client'}
                </button>
                <button onClick={handleSaveDraft} disabled={!outputText} className="px-5 py-2 text-sm rounded-full bg-white/5 border border-white/20 disabled:opacity-40 hover:bg-white/10">
                  Save Draft
                </button>
                <button onClick={copyAll} className="px-5 py-2 text-sm rounded-full border border-white/20 hover:bg-white/5">Copy All</button>
                <button onClick={downloadTxt} className="px-5 py-2 text-sm rounded-full border border-white/20 hover:bg-white/5">Download .txt</button>
                <button onClick={printToPdf} className="px-5 py-2 text-sm rounded-full border border-white/20 hover:bg-white/5">Print / Save as PDF</button>
                <button onClick={generateEmailDraft} className="px-5 py-2 text-sm rounded-full border border-white/20 text-[#94a3b8] hover:bg-white/5">
                  Open email draft (Outlook)
                </button>
              </div>
              <p className="text-[11px] text-[#64748b]">
                <span className="text-[#94a3b8]">Recommended:</span> Send proposal to client — emails a PDF attachment, marks proposal sent, and BCCs you.
                Use Outlook only if you prefer to send manually.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 text-sm text-[#cbd5e1]">
                {loadedSub.sentAt ? (
                  <>
                    <span className="font-medium text-emerald-200">Proposal sent</span>
                    <span className="block text-xs text-[#64748b] mt-0.5">
                      {new Date(loadedSub.sentAt).toLocaleString()} — Phase 4 complete.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-emerald-200">3. Sent via Outlook instead?</span>
                    <span className="block text-xs text-[#64748b] mt-0.5">
                      Only needed if you did not use Send proposal to client above.
                    </span>
                  </>
                )}
              </div>
              {!loadedSub.sentAt && (
              <button
                onClick={handleMarkSent}
                disabled={!loadedSub}
                className="shrink-0 px-6 py-2.5 text-sm font-semibold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
              >
                Confirm: Sent to Client
              </button>
              )}
            </div>
          </div>
        )}
      </section>
      )}

      {/* Portal access — after agreement & payment */}
      {loadedSub && (
        <section id="phase-portal" className="border border-[#c5a46e]/40 rounded-2xl bg-[#0f172a] p-6 space-y-4 scroll-mt-24">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#c5a46e]">Phase 5 — Portal</div>
            <h2 className="font-semibold text-lg mt-0.5 text-[#c5a46e]">Portal Access</h2>
            <p className="text-sm text-[#94a3b8] mt-1">
              {ADMIN_STEP89_INSTRUCTION}
            </p>
          </div>
          <div className="text-sm">
            <span className="text-[#94a3b8]">Client:</span> {loadedSub.name}{' '}
            <span className="text-[#64748b]">({loadedSub.email})</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {loadedSub.engagementCommittedAt ? (
              <span className="text-xs px-2 py-1 rounded bg-amber-900/40 text-amber-300">
                Agreement & payment — {new Date(loadedSub.engagementCommittedAt).toLocaleString()}
              </span>
            ) : (
              <button
                onClick={() => handleMarkStep8()}
                disabled={busyId === loadedSub.id}
                className="px-5 py-2 text-sm rounded-full border border-amber-500/40 text-amber-200 hover:bg-amber-900/20 disabled:opacity-50"
              >
                {busyId === loadedSub.id ? 'Saving…' : 'Mark agreement signed & paid'}
              </button>
            )}
            {loadedSub.portalAccessGrantedAt && loadedSub.mustChangePassword !== false && (
              <span className="text-xs px-2 py-1 rounded bg-sky-900/40 text-sky-300">
                Portal granted {new Date(loadedSub.portalAccessGrantedAt).toLocaleString()} — awaiting first login
              </span>
            )}
            {loadedSub.portalAccessGrantedAt && loadedSub.mustChangePassword === false && (
              <span className="text-xs px-2 py-1 rounded bg-emerald-900/40 text-emerald-300">
                Portal active since {new Date(loadedSub.portalAccessGrantedAt).toLocaleString()}
              </span>
            )}
            {loadedSub.portalRevokedAt && !loadedSub.portalAccessGrantedAt && (
              <span className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-300">
                Portal revoked {new Date(loadedSub.portalRevokedAt).toLocaleString()}
              </span>
            )}
            {loadedSub.engagementCommittedAt && !loadedSub.portalAccessGrantedAt && (
              <button
                onClick={() => handleGrantPortalAccess()}
                disabled={isGrantingPortal}
                className="px-6 py-2.5 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-60"
              >
                {isGrantingPortal
                  ? 'Sending…'
                  : loadedSub.portalRevokedAt
                    ? 'Re-grant Portal Access'
                    : 'Grant Portal Access'}
              </button>
            )}
            {loadedSub.portalAccessGrantedAt && (
              <>
                <button
                  onClick={() => handleResendPortalAccess()}
                  disabled={busyId === loadedSub.id || isGrantingPortal}
                  className="px-5 py-2 text-sm rounded-full border border-white/20 hover:bg-white/5 disabled:opacity-50"
                >
                  {busyId === loadedSub.id && isGrantingPortal ? 'Sending…' : 'Resend Portal Access'}
                </button>
                <button
                  onClick={() => handleRevokePortalAccess()}
                  disabled={busyId === loadedSub.id}
                  className="px-5 py-2 text-sm rounded-full border border-red-500/40 text-red-200 hover:bg-red-900/20 disabled:opacity-50"
                >
                  {busyId === loadedSub.id ? 'Revoking…' : 'Revoke Portal Access'}
                </button>
              </>
            )}
          </div>
          {!loadedSub.engagementCommittedAt && (
            <p className="text-xs text-[#64748b]">
              {ADMIN_PORTAL_DISABLED_UNTIL_STEP8}
            </p>
          )}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <p className="text-xs font-medium text-[#94a3b8]">Client management</p>
            <p className="text-xs text-[#64748b]">
              <strong>Revoke</strong> blocks sign-in but keeps their intake on file (use when a client disengages, or to reset a test).
              <strong className="ml-1">Delete</strong> permanently removes all records.
            </p>
            <button
              onClick={() => handleDeleteClient()}
              disabled={busyId === loadedSub.id}
              className="px-5 py-2 text-sm rounded-full border border-red-500/30 text-red-300 hover:bg-red-900/10 disabled:opacity-50"
            >
              {busyId === loadedSub.id ? 'Deleting…' : 'Delete Client Record'}
            </button>
          </div>
        </section>
      )}

      <CalendlyIntegrationPanel
        onMessage={(message) => {
          setStatus(message);
          window.setTimeout(() => setStatus(''), 5000);
        }}
      />
    </div>
  );
}
