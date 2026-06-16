'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getCalendlyIntegrationStatusForAdmin,
  simulateCalendlyWebhookForAdmin,
} from '@/app/actions';
import type { PrepSubmission } from '@/lib/submissions-store';
import type { CalendlyMeetingKind } from '@/lib/calendly-config';

interface Status {
  webhookUrl: string;
  signingKeyConfigured: boolean;
  testSecretConfigured: boolean;
  connected: boolean;
  lastReceived: string | null;
  lastEvent: string | null;
  lastOutcome: string | null;
  lastEmail: string | null;
  lastDetail: string | null;
}

interface Props {
  loadedSub: PrepSubmission | null;
  onSubmissionUpdated: (sub: PrepSubmission) => void;
  onMessage: (message: string) => void;
  onRefreshRecent: () => void | Promise<void>;
}

export default function CalendlyIntegrationPanel({
  loadedSub,
  onSubmissionUpdated,
  onMessage,
  onRefreshRecent,
}: Props) {
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [simBusy, setSimBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    const res = await getCalendlyIntegrationStatusForAdmin();
    if (res.success && res.webhookUrl) {
      setStatus({
        webhookUrl: res.webhookUrl,
        signingKeyConfigured: !!res.signingKeyConfigured,
        testSecretConfigured: !!res.testSecretConfigured,
        connected: !!res.connected,
        lastReceived: res.lastReceived ?? null,
        lastEvent: res.lastEvent ?? null,
        lastOutcome: res.lastOutcome ?? null,
        lastEmail: res.lastEmail ?? null,
        lastDetail: res.lastDetail ?? null,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function copyWebhookUrl() {
    if (!status?.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(status.webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onMessage('Copy failed — select the URL and copy manually.');
    }
  }

  async function runSimulator(
    kind: CalendlyMeetingKind,
    event: 'invitee.created' | 'invitee.canceled',
  ) {
    if (!loadedSub) {
      onMessage('Load a client first to run the webhook simulator.');
      return;
    }

    const key = `${kind}-${event}`;
    setSimBusy(key);
    const res = await simulateCalendlyWebhookForAdmin(loadedSub.id, kind, event);
    setSimBusy(null);
    await refreshStatus();
    await onRefreshRecent();

    if (res.success && res.submission) {
      onSubmissionUpdated(res.submission as PrepSubmission);
      onMessage(res.message || 'Simulator completed.');
    } else {
      onMessage(res.error || res.message || 'Simulator failed.');
    }
  }

  const statusDot = status?.connected
    ? 'bg-emerald-400'
    : status?.lastReceived
      ? 'bg-amber-400'
      : 'bg-[#64748b]';

  const statusLabel = status?.connected
    ? 'Connected — webhooks received'
    : status?.lastReceived
      ? 'Received events — awaiting successful update'
      : 'Awaiting first webhook';

  return (
    <section className="border border-white/10 rounded-2xl bg-[#0f172a] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02]"
      >
        <div>
          <h2 className="font-semibold text-lg">Calendly Integration</h2>
          <p className="text-xs text-[#64748b] mt-0.5">Webhook URL, status, and test simulator</p>
        </div>
        <span className="text-[#94a3b8] text-sm">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusDot}`} />
            <span className="text-[#cbd5e1]">{loading ? 'Checking…' : statusLabel}</span>
            <button
              type="button"
              onClick={() => void refreshStatus()}
              className="text-xs px-2 py-1 rounded border border-white/15 text-[#94a3b8] hover:bg-white/5"
            >
              Refresh status
            </button>
          </div>

          {status && (
            <>
              <div>
                <div className="text-xs uppercase tracking-wide text-[#94a3b8] mb-1.5">
                  Calendly Webhook URL
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <code className="flex-1 text-xs bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-[#cbd5e1] break-all">
                    {status.webhookUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyWebhookUrl()}
                    className="shrink-0 text-xs px-4 py-2 rounded-full border border-white/20 hover:bg-white/5"
                  >
                    {copied ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-[#64748b]">Signing key (Vercel):</span>{' '}
                  <span className={status.signingKeyConfigured ? 'text-emerald-300' : 'text-amber-300'}>
                    {status.signingKeyConfigured ? 'Configured' : 'Not set'}
                  </span>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-[#64748b]">Test secret (Vercel):</span>{' '}
                  <span className={status.testSecretConfigured ? 'text-emerald-300' : 'text-amber-300'}>
                    {status.testSecretConfigured ? 'Configured' : 'Not set'}
                  </span>
                </div>
              </div>

              {status.lastReceived && (
                <div className="text-xs text-[#94a3b8] rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-[#64748b]">Last received:</span>{' '}
                  {new Date(status.lastReceived).toLocaleString()}
                  {status.lastEvent && <> · <span className="text-[#cbd5e1]">{status.lastEvent}</span></>}
                  {status.lastOutcome && <> · {status.lastOutcome}</>}
                  {status.lastEmail && <> · {status.lastEmail}</>}
                  {status.lastDetail && <span className="block mt-1 text-[#64748b]">{status.lastDetail}</span>}
                </div>
              )}

              <div className="rounded-lg border border-[#c5a46e]/25 bg-[#c5a46e]/5 px-4 py-3 text-xs text-[#cbd5e1] space-y-2">
                <p className="font-medium text-[#c5a46e]">Create subscription in Calendly</p>
                <ol className="list-decimal list-inside space-y-1 text-[#94a3b8]">
                  <li>Calendly → Integrations → Webhooks → Create Webhook Subscription</li>
                  <li>Paste the URL above · Events: invitee.created + invitee.canceled</li>
                  <li>Copy signing key → Vercel env CALENDLY_WEBHOOK_SIGNING_KEY → redeploy</li>
                </ol>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="text-xs font-medium text-[#94a3b8]">Test webhook (loaded client)</div>
                {!loadedSub ? (
                  <p className="text-xs text-[#64748b]">Load a client above to simulate booking events.</p>
                ) : (
                  <>
                    <p className="text-xs text-[#64748b]">
                      Simulates Calendly for <span className="text-[#e2e8f0]">{loadedSub.name}</span> — does not
                      send email.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!!simBusy}
                        onClick={() => void runSimulator('consult30', 'invitee.created')}
                        className="text-xs px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/20 disabled:opacity-50"
                      >
                        {simBusy === 'consult30-invitee.created' ? '…' : 'Simulate 30-min booked'}
                      </button>
                      <button
                        type="button"
                        disabled={!!simBusy}
                        onClick={() => void runSimulator('comprehensive60', 'invitee.created')}
                        className="text-xs px-3 py-1.5 rounded-full border border-sky-500/40 text-sky-200 hover:bg-sky-900/20 disabled:opacity-50"
                      >
                        {simBusy === 'comprehensive60-invitee.created' ? '…' : 'Simulate 1-hr booked'}
                      </button>
                      <button
                        type="button"
                        disabled={!!simBusy}
                        onClick={() => void runSimulator('consult30', 'invitee.canceled')}
                        className="text-xs px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-200 hover:bg-amber-900/20 disabled:opacity-50"
                      >
                        {simBusy === 'consult30-invitee.canceled' ? '…' : 'Simulate 30-min canceled'}
                      </button>
                      <button
                        type="button"
                        disabled={!!simBusy}
                        onClick={() => void runSimulator('comprehensive60', 'invitee.canceled')}
                        className="text-xs px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-200 hover:bg-amber-900/20 disabled:opacity-50"
                      >
                        {simBusy === 'comprehensive60-invitee.canceled' ? '…' : 'Simulate 1-hr canceled'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}