'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PortalPrivateNotice from '@/components/portal/PortalPrivateNotice';
import {
  clientSignInWithPassword,
  clientSetPassword,
  sendClientMagicLink,
} from '@/app/actions';
import { site } from '@/lib/site';

type Tab = 'signin' | 'password' | 'link';

function PortalAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [urlNotice, setUrlNotice] = useState('');

  useEffect(() => {
    const err = searchParams.get('error');
    const confirmed = searchParams.get('confirmed');

    if (confirmed === '1') {
      setUrlNotice('Your email is confirmed. Create a secure password below, or sign in with an email link.');
      setTab('password');
    } else if (err === 'invalid' || err === 'confirm-invalid') {
      setUrlNotice('That link is invalid or has expired. If your portal is active, request a new sign-in link below.');
    } else if (err === 'not-invited' || err === 'not-activated') {
      setUrlNotice('Your portal access is not fully active yet. Confirm your email from the invitation we sent, or contact Michael if you need help.');
    } else if (err === 'confirm-failed') {
      setUrlNotice('We could not confirm your email. Please ask Michael to resend your portal invitation.');
    }
  }, [searchParams]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const res = await clientSignInWithPassword(formData);
    if (res.success) {
      router.push('/portal');
      return;
    }
    setStatus({ type: 'error', message: res.error || 'Sign-in failed.' });
    setIsLoading(false);
  }

  async function handleSetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const res = await clientSetPassword(formData);
    if (res.success) {
      router.push('/portal');
      return;
    }
    setStatus({ type: 'error', message: res.error || 'Could not save password.' });
    setIsLoading(false);
  }

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const res = await sendClientMagicLink(formData);
    if (res.success) {
      setStatus({
        type: 'success',
        message: 'We sent a secure sign-in link to your inbox. Please check spam if you do not see it within a few minutes.',
      });
    } else {
      setStatus({ type: 'error', message: res.error || 'Could not send sign-in link.' });
    }
    setIsLoading(false);
  }

  const tabClass = (value: Tab) =>
    `flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      tab === value
        ? 'bg-[#8f6f3d] text-black'
        : 'text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9] flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#c5a46e]/40 bg-[#c5a46e]/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#c5a46e]" aria-hidden>
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h14.25a3 3 0 003-3V12.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Client Portal</h1>
          <p className="text-[#94a3b8] mt-2 text-sm">{site.name}</p>
        </div>

        <PortalPrivateNotice />

        {urlNotice && (
          <div className="p-4 border border-sky-500/30 bg-sky-950/20 rounded-xl text-sm text-sky-100">
            {urlNotice}
          </div>
        )}

        {status && (
          <div
            className={`p-4 rounded-xl text-sm border ${
              status.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                : 'border-red-500/40 bg-red-950/20 text-red-200'
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="border border-white/10 bg-[#0f172a] rounded-2xl p-6 space-y-5">
          <div className="flex gap-1 p-1 bg-black/20 rounded-xl">
            <button type="button" onClick={() => setTab('signin')} className={tabClass('signin')}>
              Sign In
            </button>
            <button type="button" onClick={() => setTab('password')} className={tabClass('password')}>
              Set Password
            </button>
            <button type="button" onClick={() => setTab('link')} className={tabClass('link')}>
              Email Link
            </button>
          </div>

          {tab === 'signin' && (
            <>
              <p className="text-xs text-[#64748b]">Sign in with the email and password you created after confirming your invitation.</p>
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
                  <label htmlFor="signin-password" className="block text-sm text-[#94a3b8] mb-1.5">Password</label>
                  <input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                    placeholder="Your portal password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-5 py-3 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-semibold text-sm rounded-full transition-all disabled:opacity-60"
                >
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            </>
          )}

          {tab === 'password' && (
            <>
              <p className="text-xs text-[#64748b]">
                Available after you confirm your email from Michael&apos;s invitation. Use the same email address from your consultation intake.
              </p>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <input type="text" name="company_website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
                <div>
                  <label htmlFor="setup-email" className="block text-sm text-[#94a3b8] mb-1.5">Email</label>
                  <input
                    id="setup-email"
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
                  <label htmlFor="setup-password" className="block text-sm text-[#94a3b8] mb-1.5">New password</label>
                  <input
                    id="setup-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label htmlFor="setup-confirm" className="block text-sm text-[#94a3b8] mb-1.5">Confirm password</label>
                  <input
                    id="setup-confirm"
                    name="confirm_password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                    placeholder="Re-enter password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-5 py-3 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-semibold text-sm rounded-full transition-all disabled:opacity-60"
                >
                  {isLoading ? 'Saving…' : 'Create Password & Enter Portal'}
                </button>
              </form>
            </>
          )}

          {tab === 'link' && (
            <>
              <p className="text-xs text-[#64748b]">
                Prefer passwordless sign-in? We will email a secure one-time link. Your email must already be confirmed.
              </p>
              <form onSubmit={handleMagicLink} className="space-y-4">
                <input type="text" name="company_website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
                <div>
                  <label htmlFor="link-email" className="block text-sm text-[#94a3b8] mb-1.5">Email</label>
                  <input
                    id="link-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                    placeholder="you@company.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-5 py-3 border border-white/20 hover:bg-white/5 font-medium text-sm rounded-full transition-all disabled:opacity-60"
                >
                  {isLoading ? 'Sending…' : 'Email Me a Secure Sign-In Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#64748b] leading-relaxed">
          New to {site.name}? Complete the intake at{' '}
          <a href="/prepare-analysis" className="text-[#c5a46e] hover:underline">/prepare-analysis</a>
          {' '}first. Portal invitations are sent manually after agreement and payment.
        </p>
      </div>
    </div>
  );
}

export default function ClientPortalLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f2c]" />}>
      <PortalAuthForm />
    </Suspense>
  );
}