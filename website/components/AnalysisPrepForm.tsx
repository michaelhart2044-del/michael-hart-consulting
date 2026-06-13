'use client';

import { useState } from 'react';
import { sendAnalysisPrep } from '@/app/actions';
import { site } from '@/lib/site';

const industryOptions = [
  'Finance & Accounting',
  'Healthcare',
  'Manufacturing & Distribution',
  'Technology & SaaS',
  'Professional Services',
  'Other'
];

const challengeOptions = [
  'Month-end close / reporting takes too long',
  'Balance sheet & account reconciliations are slow',
  'Data not available to stakeholders on time',
  'Too many manual processes / spreadsheets',
  'Controls, audit or SOX concerns',
  'Want to explore automation / AI tools',
  'Other'
];

export default function AnalysisPrepForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState('');

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
        <p className="text-green-400 text-lg font-medium">Thank you — your details have been sent to Michael.</p>
        <p className="text-muted mt-2">We&apos;ve emailed you a copy as well.</p>

        <a
          href={site.calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block w-full md:w-auto text-center px-6 py-2.5 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm md:text-base rounded-full transition-all active:scale-[0.985]"
        >
          Book Initial Consultation
        </a>
        <p className="text-sm text-subtle mt-4">(opens Calendly in a new tab)</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-sm text-muted mb-1.5">Full Name <span className="text-accent">*</span></label>
          <input
            id="name"
            type="text"
            name="name"
            required
            aria-required="true"
            aria-describedby={error ? 'form-error' : undefined}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm text-muted mb-1.5">Email Address <span className="text-accent">*</span></label>
          <input
            id="email"
            type="email"
            name="email"
            required
            aria-required="true"
            aria-describedby={error ? 'form-error' : undefined}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
            placeholder="you@company.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="industry" className="block text-sm text-muted mb-1.5">Industry / Business Type</label>
        <select
          id="industry"
          name="industry"
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm"
        >
          <option value="">Select...</option>
          {industryOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="main_challenge" className="block text-sm text-muted mb-1.5">Main Challenge Right Now</label>
        <select
          id="main_challenge"
          name="main_challenge"
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm"
          onChange={(e) => setSelectedChallenge(e.target.value)}
          value={selectedChallenge}
        >
          <option value="">Select...</option>
          {challengeOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {selectedChallenge === 'Other' && (
        <div>
          <label htmlFor="main_challenge_other" className="block text-sm text-muted mb-1.5">Please describe your main challenge</label>
          <input
            id="main_challenge_other"
            type="text"
            name="main_challenge_other"
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
            placeholder="Brief description..."
          />
        </div>
      )}

      <div>
        <label htmlFor="people_involved" className="block text-sm text-muted mb-1.5">How many people are currently involved in month-end / reporting?</label>
        <input
          id="people_involved"
          type="text"
          name="people_involved"
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
          placeholder="e.g. 4-6"
        />
      </div>

      <div>
        <label htmlFor="success_looks_like" className="block text-sm text-muted mb-1.5">What does “success” look like in the next 30–90 days?</label>
        <textarea
          id="success_looks_like"
          name="success_looks_like"
          rows={2}
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
          placeholder="e.g. Reliable close in under 10 days..."
        />
      </div>

      <div>
        <label htmlFor="additional_context" className="block text-sm text-muted mb-1.5">Any specific deadlines, stakeholders, or upcoming changes we should know about? (optional)</label>
        <textarea
          id="additional_context"
          name="additional_context"
          rows={2}
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
          placeholder="e.g. Audit in 6 weeks, new system go-live..."
        />
      </div>

      {error && (
        <p id="form-error" role="alert" aria-live="assertive" className="text-red-400 text-sm">
          {error}
        </p>
      )}

      {/* Honeypot */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full md:w-auto px-6 py-2.5 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm md:text-base rounded-full transition-all active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send details (optional)'}
      </button>

      <p className="text-xs text-subtle">Optional — you can book without sharing details.</p>
    </form>
  );
}
