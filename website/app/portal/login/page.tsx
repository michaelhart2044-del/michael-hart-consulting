'use client';

import { useState } from 'react';
import { sendClientMagicLink } from '@/app/actions';

export default function ClientPortalLogin() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const res = await sendClientMagicLink(formData);
    setResult(res);
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Private Engagement Portal</h1>
          <p className="text-[#94a3b8] mt-2">Access your consultation preparation and schedule your deep-dive meeting.</p>
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
            {isLoading ? 'Sending...' : 'Send secure access link'}
          </button>
        </form>

        {/* Success message after sending the magic link (production) */}
        {result && result.success && (
          <div className="mt-6 p-4 border border-[#c5a46e] bg-[#0f172a] rounded-xl text-center">
            <p className="text-[#c5a46e] font-semibold">We've sent a secure magic link to your email.</p>
            <p className="text-sm text-[#94a3b8] mt-1">Please check your inbox (and spam folder). The link is valid for 30 days.</p>
          </div>
        )}

        {result && result.error && (
          <p className="mt-4 text-red-400 text-sm">{result.error}</p>
        )}

        <p className="text-center text-xs text-[#64748b] mt-4">
          Check your inbox for a magic link (valid for 30 days). This portal is private for your engagement only.
        </p>
      </div>
    </div>
  );
}
