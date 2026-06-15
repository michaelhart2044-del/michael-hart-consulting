'use client';

import { useState } from 'react';
import { sendClientMagicLink, testDirectClientLogin } from '@/app/actions';

export default function ClientPortalLogin() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const res = await sendClientMagicLink(formData);
    setResult(res);
    setIsLoading(false);
  }

  async function handleTestMode(email: string) {
    if (!email) {
      alert('Please enter an email that has a prep submission first (see local /admin).');
      return;
    }
    setTestLoading(true);
    const res = await testDirectClientLogin(email);
    setTestLoading(false);
    if (res.success) {
      // Directly logged in - go to the guided portal
      window.location.href = '/portal';
    } else {
      alert(res.error || 'Test login failed. Make sure you have a matching submission from /prepare-analysis.');
    }
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

        {/* TEMPORARY TEST MODE BYPASS - LOCAL ONLY */}
        <div className="mt-6 p-4 border-4 border-red-500 bg-[#1a0f0f] rounded-2xl">
          <div className="text-red-400 font-bold text-lg mb-2 text-center">
            🔥 TEST MODE (LOCAL DEV ONLY) 🔥
          </div>
          <p className="text-xs text-[#94a3b8] mb-3 text-center">
            Skips the magic link entirely.<br />Directly logs you in with an existing submission email and jumps straight to the guided first-time portal experience.
          </p>
          <button
            onClick={() => {
              const emailInput = (document.getElementById('email') as HTMLInputElement)?.value || 'haikharutyunyan@yahoo.com';
              handleTestMode(emailInput);
            }}
            disabled={testLoading}
            className="w-full px-5 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-full transition-all disabled:opacity-60"
          >
            {testLoading ? 'Logging in directly...' : 'TEST MODE: Log in directly & go to guided portal'}
          </button>
          <p className="text-[10px] text-[#64748b] mt-2 text-center">
            Use an email from your local /admin "Recent Prep Submissions" list.
          </p>
        </div>

        {result && result.loginUrl && (
          <div className="mt-6 p-4 border-2 border-[#c5a46e] bg-[#111827] rounded-xl">
            <p className="text-[#c5a46e] font-semibold mb-2">🔗 LOCAL TEST LINK (copy & paste this):</p>
            <a 
              href={result.loginUrl} 
              className="block break-all text-sm text-[#f1f5f9] hover:underline bg-black/30 p-2 rounded"
              target="_blank"
              rel="noopener noreferrer"
            >
              {result.loginUrl}
            </a>
            <p className="text-xs text-[#64748b] mt-2">This link was also printed in your terminal. Use this to test the verify flow immediately.</p>
          </div>
        )}

        {result && !result.loginUrl && result.error && (
          <p className="mt-4 text-red-400 text-sm">{result.error}</p>
        )}

        <p className="text-center text-xs text-[#64748b] mt-4">
          Check your inbox for a magic link (valid for 30 days). This portal is private for your engagement only.
          <br />For local testing, use the red TEST MODE button above or the link in the box / terminal.
        </p>
      </div>
    </div>
  );
}
