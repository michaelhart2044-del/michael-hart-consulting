'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PortalPrivateNotice from '@/components/portal/PortalPrivateNotice';
import { clientSignInWithPassword } from '@/app/actions';
import { site } from '@/lib/site';

export default function ClientPortalLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const res = await clientSignInWithPassword(formData);
    if (res.success) {
      router.push(res.mustChangePassword ? '/portal/change-password' : '/portal');
      return;
    }
    setStatus({ type: 'error', message: res.error || 'Sign-in failed.' });
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#c5a46e]/40 bg-[#c5a46e]/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#c5a46e]" aria-hidden>
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h14.25a3 3 0 003-3V12.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {site.name} • Client Portal
          </h1>
        </div>

        <PortalPrivateNotice />

        {status && (
          <div className="p-4 rounded-xl text-sm border border-red-500/40 bg-red-950/20 text-red-200">
            {status.message}
          </div>
        )}

        <div className="border border-white/10 bg-[#0f172a] rounded-2xl p-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <input type="text" name="company_website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
            <div>
              <label htmlFor="signin-email" className="block text-sm text-[#94a3b8] mb-1.5">Email</label>
              <input
                id="signin-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="signin-password" className="block text-sm text-[#94a3b8] mb-1.5">Temporary Password</label>
              <input
                id="signin-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                placeholder="From your welcome email"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-5 py-3.5 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-semibold text-base rounded-full transition-all disabled:opacity-60"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#64748b] leading-relaxed">
          New to {site.name}? Complete the intake at{' '}
          <a href="/prepare-analysis" className="text-[#c5a46e] hover:underline">/prepare-analysis</a>
          {' '}first. Portal access is granted after agreement and payment.
        </p>
      </div>
    </div>
  );
}