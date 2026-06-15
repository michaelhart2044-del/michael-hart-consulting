'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { sendClientMagicLink } from '@/app/actions';

function PortalLoginForm() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'invalid') {
      setUrlError('That link is invalid or has expired. Request a new one below if your portal access is already active.');
    } else if (err === 'not-invited') {
      setUrlError('Portal access has not been activated for this account yet. You will receive an invitation after your engagement agreement is complete.');
    }
  }, [searchParams]);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setUrlError('');
    const res = await sendClientMagicLink(formData);
    setResult(res);
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Private Engagement Portal</h1>
          <p className="text-[#94a3b8] mt-2">
            For active engagements only — access is granted after your agreement and payment are complete.
          </p>
        </div>

        {urlError && (
          <div className="mb-4 p-4 border border-amber-500/40 bg-amber-950/20 rounded-xl text-sm text-amber-200">
            {urlError}
          </div>
        )}

        <div className="mb-6 p-4 border border-white/10 bg-[#0f172a] rounded-xl text-sm text-[#94a3b8]">
          <p className="font-medium text-[#f1f5f9] mb-1">How access works</p>
          <p>
            After your initial consultation and signed agreement, Michael will send you a secure magic link to this portal.
            If you already have access, you can request a new link below.
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4 border border-white/10 bg-[#0f172a] p-6 rounded-2xl">
          <div>
            <label htmlFor="email" className="block text-sm text-[#94a3b8] mb-1.5">Your email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
              placeholder="you@company.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-5 py-3 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm rounded-full transition-all disabled:opacity-60"
          >
            {isLoading ? 'Sending...' : 'Request new access link'}
          </button>
        </form>

        {result && result.success && (
          <div className="mt-6 p-4 border border-[#c5a46e] bg-[#0f172a] rounded-xl text-center">
            <p className="text-[#c5a46e] font-semibold">We&apos;ve sent a secure magic link to your email.</p>
            <p className="text-sm text-[#94a3b8] mt-1">Please check your inbox (and spam folder). The link is valid for 30 days.</p>
          </div>
        )}

        {result && result.error && (
          <p className="mt-4 text-red-400 text-sm">{result.error}</p>
        )}

        <p className="text-center text-xs text-[#64748b] mt-4">
          New leads: complete the intake at /prepare-analysis first. Portal access comes after agreement (Step 9).
        </p>
      </div>
    </div>
  );
}

export default function ClientPortalLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f2c]" />}>
      <PortalLoginForm />
    </Suspense>
  );
}