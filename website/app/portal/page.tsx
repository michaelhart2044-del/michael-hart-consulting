import { getClientEngagementData, logoutClient } from '@/app/actions';
import { redirect } from 'next/navigation';
import Script from 'next/script';

export const dynamic = 'force-dynamic';
import ClientPreMeetingForm from './ClientPreMeetingForm';
import PortalComprehensiveBooking from './PortalComprehensiveBooking';
export default async function ClientPortal() {
  const session = await getClientEngagementData();

  if (!session.success || !session.submission) {
    redirect('/portal/login');
  }

  if (session.mustChangePassword) {
    redirect('/portal/login');
  }

  const sub = session.submission;
  const hasPreMeeting = !!sub.preMeetingDiscovery;

  async function handleLogout() {
    'use server';
    await logoutClient();
    redirect('/portal/login');
  }

  return (
    <>
      <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9]">
        <header className="border-b border-white/10 bg-[#0f172a]">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">Private Engagement Portal</div>
              <div className="text-xs text-[#64748b]">{sub.name} • {sub.email}</div>
            </div>
            <form action={handleLogout}>
              <button type="submit" className="text-sm px-4 py-1.5 rounded-full border border-white/20 hover:bg-white/5">
                Log out
              </button>
            </form>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          {!hasPreMeeting ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight">Welcome, {sub.name.split(' ')[0]}.</h1>
                <p className="text-[#94a3b8] mt-2 max-w-prose">
                  A few quick questions help us prepare. The detailed work happens on your 1-hour team meeting.
                </p>
              </div>

              <section className="mb-8 border border-white/10 bg-[#0f172a] p-6 rounded-2xl">
                <h2 className="font-semibold text-lg mb-4">Your Initial Intake Summary</h2>
                <div className="grid gap-4 text-sm">
                  <div><span className="text-[#94a3b8]">Industry / Business Type:</span> {sub.industry}</div>
                  <div><span className="text-[#94a3b8]">Main Challenge:</span> {sub.mainChallenge}</div>
                  {sub.additionalChallenges?.length > 0 && (
                    <div><span className="text-[#94a3b8]">Additional Challenges:</span> {sub.additionalChallenges.join(', ')}</div>
                  )}
                  <div><span className="text-[#94a3b8]">Team / People Involved:</span> {sub.peopleInvolved}</div>
                  <div><span className="text-[#94a3b8]">What success looks like (30-90 days):</span> {sub.successLooksLike}</div>
                  {sub.additionalContext && <div><span className="text-[#94a3b8]">Additional context:</span> {sub.additionalContext}</div>}
                </div>
              </section>

              <section className="border border-white/10 bg-[#0f172a] p-6 rounded-2xl">
                <h2 className="font-semibold text-lg mb-2">Step 2 — Quick Prep (2 minutes)</h2>
                <ClientPreMeetingForm initialData={{ name: sub.name, email: sub.email }} />
              </section>
            </>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Thank you, {sub.name.split(' ')[0]}.</h1>
                <p className="text-[#94a3b8] mt-2">Your prep answers are saved. Schedule your 1-hour meeting below.</p>
              </div>

              <section className="border border-white/10 bg-[#0f172a] p-6 rounded-2xl">
                <h2 className="font-semibold mb-2">Prep complete</h2>
                <p className="text-sm text-[#94a3b8]">Initial intake + quick portal questions collected.</p>
              </section>

              <PortalComprehensiveBooking name={sub.name} email={sub.email} />
            </div>
          )}
        </main>
      </div>

      {hasPreMeeting && (
        <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" />
      )}
    </>
  );
}