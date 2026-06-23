'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSignWellIntegrationStatusForAdmin } from '@/app/actions';

interface Status {
  webhookUrl: string;
  webhookIdConfigured: boolean;
  connected: boolean;
  lastReceived: string | null;
  lastEvent: string | null;
  lastOutcome: string | null;
  lastDetail: string | null;
}

interface Props {
  onMessage: (message: string) => void;
}

export default function SignWellIntegrationPanel({ onMessage }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    const res = await getSignWellIntegrationStatusForAdmin();
    if (res.success && res.webhookUrl) {
      setStatus({
        webhookUrl: res.webhookUrl,
        webhookIdConfigured: !!res.webhookIdConfigured,
        connected: !!res.connected,
        lastReceived: res.lastReceived ?? null,
        lastEvent: res.lastEvent ?? null,
        lastOutcome: res.lastOutcome ?? null,
        lastDetail: res.lastDetail ?? null,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshStatus();
    });
  }, [refreshStatus]);

  const statusDot = status?.connected
    ? 'bg-emerald-400'
    : status?.webhookIdConfigured
      ? 'bg-amber-400'
      : 'bg-slate-500';

  const statusLabel = status?.connected
    ? 'Webhook received — signing updates flowing'
    : status?.webhookIdConfigured
      ? 'Configured — awaiting first SignWell event'
      : 'Not configured';

  return (
    <section className="border border-white/10 rounded-2xl bg-[#0f172a] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/[0.02]"
      >
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#94a3b8]">Integrations</div>
          <div className="font-semibold text-[#f1f5f9] mt-0.5">SignWell webhooks</div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
          <span className={`inline-block w-2 h-2 rounded-full ${statusDot}`} />
          {loading ? 'Loading…' : statusLabel}
          <span className="text-[#64748b]">{open ? '▾' : '▸'}</span>
        </div>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-white/10 pt-4 text-sm">
          <p className="text-[#94a3b8]">
            Register this URL in SignWell (Settings → Webhooks). When both parties sign, click{' '}
            <span className="text-[#e2e8f0]">Refresh status</span> on the client header to update journey chips.
          </p>

          <div className="rounded-xl border border-white/10 bg-[#111827] p-4 space-y-2">
            <div className="text-[#cbd5e1] text-xs uppercase tracking-wide">Webhook URL</div>
            <code className="block text-xs text-emerald-200 break-all">{status?.webhookUrl || '…'}</code>
            <button
              type="button"
              onClick={async () => {
                if (!status?.webhookUrl) return;
                await navigator.clipboard.writeText(status.webhookUrl);
                onMessage('SignWell webhook URL copied.');
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-emerald-400/40 text-emerald-200 hover:bg-emerald-900/20"
            >
              Copy webhook URL
            </button>
          </div>

          <ol className="list-decimal list-inside space-y-1 text-[#94a3b8] text-sm">
            <li>In SignWell → Settings → API → Event Callback URL, paste the URL above</li>
            <li>Click Save Callback URLs, then copy the webhook id (API → List Webhooks) into Vercel as <code className="text-xs">SIGNWELL_WEBHOOK_ID</code></li>
            <li>Redeploy, then send/sign a test document</li>
          </ol>

          {!status?.webhookIdConfigured && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 px-4 py-3 text-amber-100">
              Add <span className="font-mono text-xs">SIGNWELL_WEBHOOK_ID</span> in Vercel, then redeploy.
            </div>
          )}

          {status?.lastReceived && (
            <div className="text-xs text-[#64748b] space-y-1">
              <div>Last webhook: {new Date(status.lastReceived).toLocaleString()}</div>
              {status.lastEvent && <div>Event: {status.lastEvent}</div>}
              {status.lastOutcome && <div>Outcome: {status.lastOutcome}</div>}
              {status.lastDetail && <div>{status.lastDetail}</div>}
            </div>
          )}

          <button
            type="button"
            onClick={() => void refreshStatus()}
            className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-[#cbd5e1] hover:bg-white/5"
          >
            Refresh status
          </button>
        </div>
      )}
    </section>
  );
}
