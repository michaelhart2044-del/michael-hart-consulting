import { verifyClientMagicAndLogin } from '@/app/actions';
import { redirect } from 'next/navigation';

export default async function ClientPortalVerify({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params.token || '';

  if (!token) {
    redirect('/portal/login');
  }

  const result = await verifyClientMagicAndLogin(token);

  if (result.success) {
    // Logged in, go to main portal dashboard
    redirect('/portal');
  }

  // Error - back to login with message (simple)
  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9] flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Access link invalid or expired</h1>
        <p className="text-[#94a3b8] mt-2">Please request a new access link.</p>
        <a href="/portal/login" className="inline-block mt-4 text-[#c5a46e] hover:underline">Back to login</a>
      </div>
    </div>
  );
}
