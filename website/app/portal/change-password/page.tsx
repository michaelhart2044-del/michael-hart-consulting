'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientChangePassword, getClientEngagementData } from '@/app/actions';
import { site } from '@/lib/site';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    getClientEngagementData().then((res) => {
      if (!res.success) {
        router.replace('/portal/login');
        return;
      }
      if (!res.mustChangePassword) {
        router.replace('/portal');
        return;
      }
      setCheckingSession(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const res = await clientChangePassword(formData);
    if (res.success) {
      router.push('/portal');
      return;
    }
    setStatus({ type: 'error', message: res.error || 'Could not save password.' });
    setIsLoading(false);
  }

  if (checkingSession) {
    return <div className="min-h-screen bg-[#0a0f2c]" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Set Your Password</h1>
          <p className="text-[#94a3b8] mt-2 text-sm">
            Choose a permanent password for your {site.name} client portal.
          </p>
        </div>

        {status && (
          <div className="p-4 rounded-xl text-sm border border-red-500/40 bg-red-950/20 text-red-200">
            {status.message}
          </div>
        )}

        <div className="border border-white/10 bg-[#0f172a] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="company_website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
            <div>
              <label htmlFor="new-password" className="block text-sm text-[#94a3b8] mb-1.5">New password</label>
              <input
                id="new-password"
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
              <label htmlFor="confirm-password" className="block text-sm text-[#94a3b8] mb-1.5">Confirm password</label>
              <input
                id="confirm-password"
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
              className="w-full px-5 py-3.5 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-semibold text-base rounded-full transition-all disabled:opacity-60"
            >
              {isLoading ? 'Saving…' : 'Save Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}