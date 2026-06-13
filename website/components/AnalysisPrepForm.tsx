'use client';

import { useState } from 'react';
import { sendAnalysisPrep } from '@/app/actions';
import { site } from '@/lib/site';

export default function AnalysisPrepForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError('');
    setIsSuccess(false);

    const result = await sendAnalysisPrep(formData);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || 'Something went wrong. Please try again or email us directly.');
    }

    setIsSubmitting(false);
  }

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-green-900/30 border border-green-700 rounded-2xl p-8 text-center"
      >
        <p className="text-green-400 text-lg font-medium">Thank you — your answers have been sent to Michael.</p>
        <p className="text-muted mt-2">We&apos;ve emailed you a copy as well. Now let&apos;s get the call on the calendar:</p>

        <a
          href={site.calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block w-full md:w-auto text-center px-10 py-4 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-lg rounded-full transition-all active:scale-[0.985]"
        >
          Schedule My 30-min AI-Powered Process Analysis Call
        </a>

        <p className="text-sm text-subtle mt-4">
          (opens Calendly in a new tab — you can also reply to the confirmation email with any extra details)
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Contact basics */}
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-sm text-muted mb-2">
            Full Name <span className="text-accent">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            required
            aria-required="true"
            aria-describedby={error ? 'form-error' : undefined}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm text-muted mb-2">
            Email Address <span className="text-accent">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            aria-required="true"
            aria-describedby={error ? 'form-error' : undefined}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="you@company.com"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="company" className="block text-sm text-muted mb-2">
            Company (optional)
          </label>
          <input
            id="company"
            type="text"
            name="company"
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="Acme Corp"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm text-muted mb-2">
            Your Role / Title (optional)
          </label>
          <input
            id="role"
            type="text"
            name="role"
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="Controller / CFO / Finance Manager"
          />
        </div>
      </div>

      {/* The discovery questions - same wording used in the email sent to Michael */}
      <div className="pt-2 space-y-5">
        <div className="text-sm text-accent tracking-widest font-medium">KEY DISCOVERY QUESTIONS</div>
        <p className="text-sm text-muted -mt-2">Answer any or all of these in advance. Even partial responses help Michael prepare a more valuable session (and let us generate a tailored proposal faster if you decide to move forward after the call).</p>

        <div>
          <label htmlFor="closeCycle" className="block text-sm text-muted mb-2 font-medium">
            1. Current close / reporting cycle
          </label>
          <textarea
            id="closeCycle"
            name="closeCycle"
            rows={3}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="E.g. 25 days typical month-end; biggest pain is manual bank reconciliations across 8 entities..."
          />
        </div>

        <div>
          <label htmlFor="teamEffort" className="block text-sm text-muted mb-2 font-medium">
            2. Team size &amp; monthly effort
          </label>
          <textarea
            id="teamEffort"
            name="teamEffort"
            rows={2}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="E.g. 4 people heavily involved; ~180 hours/month on close + reconciliations..."
          />
        </div>

        <div>
          <label htmlFor="systemsTools" className="block text-sm text-muted mb-2 font-medium">
            3. Systems and tools landscape
          </label>
          <textarea
            id="systemsTools"
            name="systemsTools"
            rows={2}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="E.g. NetSuite + Blackline + heavy Excel for flux and board packages. Some Power Query..."
          />
        </div>

        <div>
          <label htmlFor="painPoints" className="block text-sm text-muted mb-2 font-medium">
            4. Top pain points &amp; manual processes
          </label>
          <textarea
            id="painPoints"
            name="painPoints"
            rows={3}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="E.g. Intercompany elims, manual revenue cut-off for services, fixed asset rollforwards, preparing the investor package..."
          />
        </div>

        <div>
          <label htmlFor="successMetrics" className="block text-sm text-muted mb-2 font-medium">
            5. Definition of success
          </label>
          <textarea
            id="successMetrics"
            name="successMetrics"
            rows={2}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="E.g. Reliable 7-business-day close, board package automated, zero audit adjustments on revenue..."
          />
        </div>

        <div>
          <label htmlFor="stakeholdersDeadlines" className="block text-sm text-muted mb-2 font-medium">
            6. Stakeholders, deadlines &amp; drivers
          </label>
          <textarea
            id="stakeholdersDeadlines"
            name="stakeholdersDeadlines"
            rows={2}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="E.g. Monthly board deck due day 12; PE sponsor calls; external audit starts mid-Feb..."
          />
        </div>

        <div>
          <label htmlFor="changesContext" className="block text-sm text-muted mb-2 font-medium">
            7. Upcoming changes or important context
          </label>
          <textarea
            id="changesContext"
            name="changesContext"
            rows={2}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-subtle focus:outline-none focus:border-accent"
            placeholder="E.g. Implementing Workday Financials in Q3; two new entities from recent tuck-in acquisition; SOX readiness project kicking off..."
          />
        </div>
      </div>

      {error && (
        <p id="form-error" role="alert" aria-live="assertive" className="text-red-400 text-sm">
          {error}
        </p>
      )}

      {/* Honeypot - same name as contact form for consistent bot handling */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <label htmlFor="company_website">Company Website</label>
        <input
          id="company_website"
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="w-full md:w-auto px-10 py-4 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-lg rounded-full transition-all active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending your answers...' : 'Send Answers to Michael &amp; Get Booking Link'}
      </button>

      <p className="text-xs text-subtle">
        Submitting is optional but highly recommended — it lets us prepare in advance. You can also just book the call and use these questions to get ready.
      </p>
    </form>
  );
}
