'use client';

import { useActionState, useEffect, useState } from 'react';
import PortalPrivateNotice from '@/components/portal/PortalPrivateNotice';
import {
  clientChangePasswordAndEnterPortal,
  clientSignInWithPassword,
  getClientEngagementData,
} from '@/app/actions';
import { site } from '@/lib/site';

type Step = 'checking' | 'sign-in' | 'create-password' | 'entering';

function goToPortal() {
  window.location.replace('/portal');
}

export default function ClientPortalLogin() {
  const [step, setStep] = useState<Step>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordState, passwordAction, passwordPending] = useActionState(
    clientChangePasswordAndEnterPortal,
    null,
  );

  useEffect(() => {
    getClientEngagementData().then((res) => {
      if (!res.success) {
        setStep('sign-in');
        return;
      }
      if (res.mustChangePassword) {
        setEmail(res.submission?.email || '');
        setStep('create-password');
        return;
      }
      goToPortal();
    });
  }, []);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const res = await clientSignInWithPassword(formData);
    if (res.success) {
      if (res.mustChangePassword) {
        setEmail((formData.get('email') as string) || email);
        setPassword('');
        setStep('create-password');
        setIsLoading(false);
        return;
      }
      setStep('entering');
      goToPortal();
      return;
    }
    setStatus({ type: 'error', message: res.error || 'Sign-in failed.' });
    setIsLoading(false);
  }

  if (step === 'checking' || step === 'entering' || passwordPending) {
    return (
      <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#c5a46e]/40 bg-[#c5a46e]/10">
            <svg className="w-6 h-6 text-[#c5a46e] animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h14.25a3 3 0 003-3V12.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-lg font-medium">
            {passwordPending || step === 'entering'
              ? 'Password saved — opening your portal…'
              : 'Loading…'}
          </p>
          <p className="text-sm text-[#94a3b8]">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  const isFirstTime = step === 'create-password';
  const passwordError = passwordState?.error;

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
          {isFirstTime && (
            <p className="text-[#c5a46e] text-sm mt-2 font-medium">Step 2 of 2 — Create your password</p>
          )}
        </div>

        <PortalPrivateNotice />

        {isFirstTime && (
          <div className="p-4 border border-emerald-500/30 bg-emerald-950/20 rounded-xl text-sm text-emerald-100">
            You&apos;re signed in. Choose a permanent password below — you&apos;ll use it next time you return.
          </div>
        )}

        {(status || passwordError) && (
          <div className="p-4 rounded-xl text-sm border border-red-500/40 bg-red-950/20 text-red-200">
            {status?.message || passwordError}
          </div>
        )}

        <div className="border border-white/10 bg-[#0f172a] rounded-2xl p-6">
          {step === 'sign-in' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <input type="text" name="company_website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
              <p className="text-xs text-[#64748b]">Sign in with the email and password from your welcome email.</p>
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
                  placeholder="Temporary password from your email"
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
          ) : (
            <form action={passwordAction} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm text-[#94a3b8] mb-1.5">New password</label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm text-[#94a3b8] mb-1.5">Confirm password</label>
                <input
                  id="confirm-password"
                  name="confirm_password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                  placeholder="Re-enter password"
                />
              </div>
              <button
                type="submit"
                disabled={passwordPending}
                className="w-full px-5 py-3.5 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-semibold text-base rounded-full transition-all disabled:opacity-60"
              >
                {passwordPending ? 'Saving…' : 'Save Password & Enter Portal'}
              </button>
            </form>
          )}
        </div>

        {!isFirstTime && (
          <p className="text-center text-xs text-[#64748b] leading-relaxed">
            New to {site.name}? Complete the intake at{' '}
            <a href="/prepare-analysis" className="text-[#c5a46e] hover:underline">/prepare-analysis</a>
            {' '}first. Portal access is granted after agreement and payment.
          </p>
        )}
      </div>
    </div>
  );
}