'use client';

import { useState, useEffect } from 'react';
import {
  getRecentPrepsForAdmin,
  loadPrepForAdmin,
  markPrepAsSent,
  saveProposalDraftForAdmin,
  generateInitialProposal,
  markEngagementCommittedForAdmin,
  grantPortalAccessForAdmin,
  logoutAdmin,
} from '@/app/actions';
import type { PrepSubmission } from '@/lib/submissions-store';
import { site } from '@/lib/site';

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
  const [isGrantingPortal, setIsGrantingPortal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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
    refreshRecent();
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
    // Pre-fill the transcript/notes area with the clean fullText from the form
    setTranscript(sub.fullText || '');
    // Clear any prior generated output so user can re-generate with fresh data
    setProposal(null);
    setOutputText('');
    setStatus(`Loaded: ${sub.name} (${new Date(sub.createdAt).toLocaleDateString()})`);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setStatus('');

    const input = {
      name: loadedSub?.name || 'Client',
      industry: loadedSub?.industry || '',
      mainChallenge: loadedSub?.mainChallenge || '',
      additionalChallenges: loadedSub?.additionalChallenges || [],
      peopleInvolved: loadedSub?.peopleInvolved || '',
      successLooksLike: loadedSub?.successLooksLike || '',
      additionalContext: loadedSub?.additionalContext || '',
      transcript: transcript || '',
    };

    const res = await generateInitialProposal(input);
    if (res.success && res.proposal) {
      const p = res.proposal as Generated;
      setProposal(p);
      setOutputText(p.fullProposal);
      setStatus('Proposal generated. You can edit the text below before copying or saving.');
    } else {
      setStatus(res.error || 'Generation failed');
    }
    setIsGenerating(false);
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

    const body = `Hi ${greeting},

Thank you for the conversation. As discussed, here is the initial proposal based on the details you shared.

${text}

I'm happy to walk through any part of this on our follow-up call and tailor the scope or timeline.

Best regards,
Michael Hart
Michael Hart Consulting Group LLC
${site.phone}

---
Prepared privately using internal tools.`;

    // Full ready-to-send version for clipboard (user pastes into any email client)
    const fullDraft = `Subject: ${subject}\n\n${body}`;

    try {
      await navigator.clipboard.writeText(fullDraft);
      setStatus('Email draft copied!');
    } catch {
      setStatus('Clipboard unavailable — see console for full draft');
      console.log('=== EMAIL DRAFT (copy manually) ===\n' + fullDraft);
      setTimeout(() => setStatus(''), 4000);
      return;
    }

    // Secondary: open mail client with a SHORT body (long bodies get truncated by most clients).
    // User pastes the full version from clipboard into the email.
    const shortBody = `Hi ${greeting},

Thank you for the conversation. The full proposal is ready in your clipboard — please paste it below.

Best regards,
Michael Hart
Michael Hart Consulting Group LLC
${site.phone}`;

    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shortBody)}`;

    // Open mailto (best-effort; some browsers block or truncate)
    try {
      const link = document.createElement('a');
      link.href = mailto;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Silently ignore — clipboard success is the main win
    }

    setTimeout(() => setStatus(''), 2600);
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
      setStatus(res.message || 'Step 8 recorded.');
      if (loadedSub?.id === id) {
        setLoadedSub({
          ...loadedSub,
          engagementCommittedAt: res.engagementCommittedAt || new Date().toISOString(),
        });
      }
      await refreshRecent();
    } else {
      setStatus(res.error || 'Failed to mark Step 8');
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
    setBusyId(id);
    setIsGrantingPortal(true);
    setStatus('');
    const res = await grantPortalAccessForAdmin(id);
    if (res.success) {
      setStatus(res.message || 'Portal access granted and magic link sent.');
      const grantedAt = res.portalAccessGrantedAt || new Date().toISOString();
      if (loadedSub?.id === id) {
        setLoadedSub({ ...loadedSub, portalAccessGrantedAt: grantedAt });
      }
      await refreshRecent();
    } else {
      setStatus(res.error || 'Failed to grant portal access');
      if (loadedSub?.id === id && res.portalAccessGrantedAt) {
        setLoadedSub({ ...loadedSub, portalAccessGrantedAt: res.portalAccessGrantedAt });
      }
    }
    setIsGrantingPortal(false);
    setBusyId(null);
    setTimeout(() => setStatus(''), 5000);
  }

  async function handleMarkSent() {
    if (!loadedSub) {
      setStatus('Load a submission first');
      return;
    }
    const res = await markPrepAsSent(loadedSub.id);
    if (res.success) {
      setStatus('Marked as sent');
      // refresh the recent list so the flag appears
      await refreshRecent();
      // update local loaded state
      setLoadedSub({ ...loadedSub, sentAt: new Date().toISOString() } as any);
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
          <h1 className="text-3xl font-semibold tracking-[-1px]">Proposal Generator</h1>
          <p className="text-sm text-[#94a3b8] mt-1">Private • Data never leaves this secure area</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-1.5 rounded-full border border-white/20 hover:bg-white/5"
        >
          Sign out
        </button>
      </div>

      {status && (
        <div className="text-sm px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#c5a46e]">
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

        {recent.length === 0 && !loadingRecent && (
          <div className="text-sm text-[#94a3b8] space-y-2">
            <p>No submissions yet.</p>
            <p>
              Submit the test form at{' '}
              <a href="/prepare-analysis" className="text-[#c5a46e] underline" target="_blank" rel="noreferrer">
                /prepare-analysis
              </a>
              , then click Refresh. Entries are stored in Vercel Blob so they persist across deploys.
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
                {item.sentAt && <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-[10px]">SENT</span>}
                {item.engagementCommittedAt && <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 text-[10px]">STEP 8</span>}
                {item.portalAccessGrantedAt && <span className="px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-300 text-[10px]">PORTAL</span>}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <button
                  onClick={() => handleLoad(item.id)}
                  className="text-xs px-4 py-1.5 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black rounded-full font-medium"
                >
                  Load
                </button>
                {!item.engagementCommittedAt && (
                  <button
                    onClick={() => handleMarkStep8(item.id)}
                    disabled={busyId === item.id}
                    className="text-xs px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-200 hover:bg-amber-900/20 disabled:opacity-50"
                  >
                    {busyId === item.id ? 'Saving…' : 'Mark Step 8'}
                  </button>
                )}
                {item.engagementCommittedAt && (
                  <button
                    onClick={() => handleGrantPortalAccess(item.id)}
                    disabled={busyId === item.id || isGrantingPortal}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium disabled:opacity-50"
                  >
                    {busyId === item.id && isGrantingPortal
                      ? 'Sending…'
                      : item.portalAccessGrantedAt
                        ? 'Resend Magic Link'
                        : 'Grant Portal Access & Send Magic Link'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps 8–9 — Engagement commitment + portal access */}
      {loadedSub && (
        <section className="border border-[#c5a46e]/40 rounded-2xl bg-[#0f172a] p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg text-[#c5a46e]">Steps 8–9 — Engagement & Portal Access</h2>
            <p className="text-sm text-[#94a3b8] mt-1">
              Step 8: Mark agreement signed + payment received. Step 9: Grant portal access and email the magic link
              (guided intake summary + 1-hour prep questions at /portal — not the public prep form).
            </p>
          </div>
          <div className="text-sm">
            <span className="text-[#94a3b8]">Client:</span> {loadedSub.name}{' '}
            <span className="text-[#64748b]">({loadedSub.email})</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {loadedSub.engagementCommittedAt ? (
              <span className="text-xs px-2 py-1 rounded bg-amber-900/40 text-amber-300">
                Step 8 complete — {new Date(loadedSub.engagementCommittedAt).toLocaleString()}
              </span>
            ) : (
              <button
                onClick={() => handleMarkStep8()}
                disabled={busyId === loadedSub.id}
                className="px-5 py-2 text-sm rounded-full border border-amber-500/40 text-amber-200 hover:bg-amber-900/20 disabled:opacity-50"
              >
                {busyId === loadedSub.id ? 'Saving…' : 'Mark Step 8 — Agreement & Payment Received'}
              </button>
            )}
            {loadedSub.portalAccessGrantedAt ? (
              <>
                <span className="text-xs px-2 py-1 rounded bg-sky-900/40 text-sky-300">
                  Portal granted {new Date(loadedSub.portalAccessGrantedAt).toLocaleString()}
                </span>
                <button
                  onClick={() => handleGrantPortalAccess()}
                  disabled={isGrantingPortal || !loadedSub.engagementCommittedAt}
                  className="px-5 py-2 text-sm rounded-full border border-white/20 hover:bg-white/5 disabled:opacity-50"
                >
                  {isGrantingPortal ? 'Sending…' : 'Resend Magic Link'}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleGrantPortalAccess()}
                disabled={isGrantingPortal || !loadedSub.engagementCommittedAt}
                className="px-6 py-2.5 text-sm font-semibold rounded-full bg-[#8f6f3d] hover:bg-[#b89a6e] text-black disabled:opacity-60"
                title={!loadedSub.engagementCommittedAt ? 'Complete Step 8 first' : undefined}
              >
                {isGrantingPortal ? 'Granting & sending…' : 'Grant Portal Access & Send Magic Link'}
              </button>
            )}
          </div>
          {!loadedSub.engagementCommittedAt && (
            <p className="text-xs text-[#64748b]">
              Grant is disabled until Step 8 is marked. Clients cannot self-request a magic link before you grant access.
            </p>
          )}
        </section>
      )}

      {/* Transcript / Notes input */}
      <section className="border border-white/10 rounded-2xl bg-[#0f172a] p-6">
        <label className="block font-semibold mb-2">Or paste full transcript / notes</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={9}
          className="w-full bg-[#111827] border border-white/20 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#c5a46e] placeholder:text-[#64748b]"
          placeholder="Paste any additional notes, call transcript, or extra context here. The generator will incorporate it into both sections."
        />
        <p className="text-[11px] text-[#64748b] mt-2">Loading a prep submission above will pre-populate this with the exact structured answers the client provided.</p>
      </section>

      {/* Generate + Copy for SigVai */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-8 py-3.5 text-base font-semibold bg-[#8f6f3d] hover:bg-[#b89a6e] text-black rounded-full disabled:opacity-60 transition-all active:scale-[0.985]"
        >
          {isGenerating ? 'Generating…' : 'Generate Initial Proposal'}
        </button>

        <button
          onClick={copyForSigVai}
          className="px-8 py-3.5 text-base font-semibold bg-[#8f6f3d] hover:bg-[#b89a6e] text-black rounded-full transition-all active:scale-[0.985] ring-2 ring-offset-2 ring-offset-[#0a0f2c] ring-[#c5a46e]/60"
        >
          Copy for SigVai
        </button>
      </div>
      <p className="text-center text-xs text-[#64748b] -mt-1">
        Use “Copy for SigVai” to send clean structured input directly to your separate SigVai system.
      </p>

      {/* Output */}
      {(proposal || outputText) && (
        <section className="border border-white/10 rounded-2xl bg-[#0f172a] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Generated Proposal (editable)</h2>
            <div className="text-xs text-[#64748b]">Edit the text below — changes stay local until you Save Draft</div>
          </div>

          {/* Structured preview (read-only for quick scan) */}
          {proposal && (
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="border border-white/10 rounded-xl p-4 bg-black/20">
                <div className="uppercase tracking-[1px] text-[10px] text-[#c5a46e] mb-2">DEFINE</div>
                <pre className="whitespace-pre-wrap text-[#cbd5e1] text-[12.5px] leading-relaxed font-mono">{proposal.defineSection}</pre>
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-black/20">
                <div className="uppercase tracking-[1px] text-[10px] text-[#c5a46e] mb-2">CLIENT PITCH</div>
                <pre className="whitespace-pre-wrap text-[#cbd5e1] text-[12.5px] leading-relaxed font-mono">{proposal.pitchSection}</pre>
              </div>
            </div>
          )}

          {/* Fully editable combined output */}
          <div>
            <div className="text-xs uppercase tracking-widest text-[#94a3b8] mb-1.5">FULL EDITABLE OUTPUT</div>
            <textarea
              value={outputText}
              onChange={(e) => setOutputText(e.target.value)}
              rows={22}
              className="w-full font-mono text-sm bg-[#111827] border border-white/20 rounded-xl p-4 focus:outline-none focus:border-[#c5a46e] leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={copyAll} className="px-5 py-2 text-sm rounded-full border border-white/20 hover:bg-white/5">Copy All</button>
            <button onClick={downloadTxt} className="px-5 py-2 text-sm rounded-full border border-white/20 hover:bg-white/5">Download .txt</button>
            <button onClick={printToPdf} className="px-5 py-2 text-sm rounded-full border border-white/20 hover:bg-white/5">Print / Save as PDF</button>
            <button onClick={generateEmailDraft} className="px-5 py-2 text-sm rounded-full border border-white/20 hover:bg-white/5">Generate Email Draft</button>

            <div className="flex-1" />

            <button
              onClick={handleSaveDraft}
              disabled={!loadedSub || !outputText}
              className="px-5 py-2 text-sm rounded-full bg-white/5 border border-white/20 disabled:opacity-40 hover:bg-white/10"
            >
              Save Draft
            </button>
            <button
              onClick={handleMarkSent}
              disabled={!loadedSub}
              className="px-5 py-2 text-sm rounded-full bg-emerald-600/80 hover:bg-emerald-600 text-white disabled:opacity-40"
            >
              Mark as Sent
            </button>
          </div>

          <p className="text-[11px] text-[#64748b]">
            All actions stay inside the private tool. “Save Draft” and “Mark as Sent” persist against the loaded submission record.
          </p>
        </section>
      )}

      {/* Quick tips */}
      <div className="text-xs text-[#64748b] border-t border-white/10 pt-6">
        Tips: Load a recent submission for structured data, then add any notes or transcript in the textarea above before generating.
        The generator produces a strong DEFINE + a benefit-led CLIENT PITCH including the Engagement Activation Retainer framing and clear next steps.
        Everything is designed for direct use with SigVai / xAI or light human polish.
      </div>
    </div>
  );
}
