'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCalendlyIntegrationStatusForAdmin } from '@/app/actions';

interface Status {
  webhookUrl: string;
  signingKeyConfigured: boolean;
  connected: boolean;
  lastReceived: string | null;
  lastEvent: string | null;
  lastOutcome: string | null;
  lastEmail: string | null;
  lastDetail: string | null;
}

interface Props {
  onMessage: (message: string) => void;
}

export default function CalendlyIntegrationPanel({ onMessage }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    const res = await getCalendlyIntegrationStatusForAdmin();
    if (res.success && res.webhookUrl) {
      setStatus({
        webhookUrl: res.webhookUrl,
        signingKeyConfigured: !!res.signingKeyConfigured,
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
    queueMicrotask(() => {
      void refreshStatus();
    });
  }, [refreshStatus]);

  const statusDot = status?.connected
    ? 'bg-emerald-400'
    : status?.signingKeyConfigured
      ? 'bg-amber-400'
      : 'bg-[#64748b]';

  const statusLabel = status?.connected
    ? 'Calendly connected'
    : status?.signingKeyConfigured
      ? 'Configured — awaiting first successful booking webhook'
      : 'Signing key not configured';

  return (
    <section className="border border-white/10 rounded-xl bg-[#0f172a]/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
          <span className="text-sm text-[#cbd5e1] truncate">
            {loading ? 'Calendly…' : statusLabel}
          </span>
        </div>
        <span className="text-[#64748b] text-xs shrink-0 ml-2">{open ? 'Hide' : 'Details'}</span>
      </button>

      {open && status && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshStatus()}
              className="px-2 py-1 rounded border border-white/15 text-[#94a3b8] hover:bg-white/5"
            >
              Refresh
            </button>
            <span className="text-[#64748b]">
              Signing key:{' '}
              <span className={status.signingKeyConfigured ? 'text-emerald-300' : 'text-amber-300'}>
                {status.signingKeyConfigured ? 'OK' : 'Missing'}
              </span>
            </span>
          </div>

          {status.lastReceived && (
            <div className="text-[#94a3b8] rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              Last webhook: {new Date(status.lastReceived).toLocaleString()}
              {status.lastEvent && <> · {status.lastEvent}</>}
              {status.lastOutcome && <> · {status.lastOutcome}</>}
              {status.lastEmail && <> · {status.lastEmail}</>}
              {status.lastDetail && (
                <span className="block mt-1 text-[#64748b]">{status.lastDetail}</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(status.webhookUrl);
                onMessage('Webhook URL copied.');
              } catch {
                onMessage('Copy failed — select URL manually.');
              }
            }}
            className="text-[#64748b] hover:text-[#94a3b8] underline underline-offset-2"
          >
            Copy webhook URL
          </button>
        </div>
      )}
    </section>
  );
}
