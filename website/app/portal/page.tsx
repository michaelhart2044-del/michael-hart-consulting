import { getClientEngagementData, savePreMeetingDiscovery, logoutClient } from '@/app/actions';
import { redirect } from 'next/navigation';
import { analysisQuestions } from '@/lib/analysis-questions';
import ClientPreMeetingForm from './ClientPreMeetingForm';
import { site } from '@/lib/site';

export default async function ClientPortal() {
  const session = await getClientEngagementData();

  if (!session.success || !session.submission) {
    redirect('/portal/login');
  }

  const sub = session.submission;

  // If they have already completed pre-meeting discovery, show summary + book prompt
  const hasPreMeeting = !!sub.preMeetingDiscovery;

  async function handleLogout() {
    'use server';
    await logoutClient();
    redirect('/portal/login');
  }

  return (
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
          // First-time guided flow: review initial + additional questions
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight">Welcome, {sub.name.split(' ')[0]}.</h1>
              <p className="text-[#94a3b8] mt-2 max-w-prose">
                This short guided experience will help us come fully prepared to your 1-hour deep-dive meeting.
                We&apos;ve started with the details you shared earlier.
              </p>
            </div>

            {/* Part 1: Review initial intake (summary) */}
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
              <p className="text-xs text-[#64748b] mt-4">If anything has changed, you can update it during the questions below.</p>
            </section>

            {/* Part 2: Additional questions for the 1-hour meeting (client-friendly, using existing questions + extras) */}
            <section className="border border-white/10 bg-[#0f172a] p-6 rounded-2xl">
              <h2 className="font-semibold text-lg mb-2">Prepare for Your 1-Hour Deep-Dive Meeting</h2>
              <p className="text-sm text-[#94a3b8] mb-6">
                These questions will give us a complete picture of your current processes, stakeholders, and goals.
                Your answers will help make the meeting focused and productive.
              </p>

              <ClientPreMeetingForm initialData={sub} />
            </section>
          </>
        ) : (
          // After completion: summary + book prompt
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Thank you, {sub.name.split(' ')[0]}.</h1>
              <p className="text-[#94a3b8] mt-2">Your preparation details are saved. Michael now has a complete view of your engagement.</p>
            </div>

            <section className="border border-white/10 bg-[#0f172a] p-6 rounded-2xl">
              <h2 className="font-semibold mb-4">Your Preparation Summary</h2>
              <p className="text-sm">Initial intake + additional details collected. Ready for the deep-dive discussion.</p>
            </section>

            <section className="border border-white/10 bg-[#0f172a] p-6 rounded-2xl">
              <h2 className="font-semibold mb-2">Next Step: Schedule Your 1-Hour Comprehensive Team Meeting</h2>
              <p className="text-sm text-[#94a3b8] mb-4">
                This focused session will cover live validation and the key areas for your engagement roadmap.
              </p>
              <a
                href={site.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm rounded-full"
              >
                Book Your 1-Hour Meeting
              </a>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
