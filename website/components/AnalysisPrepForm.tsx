'use client';

import { useState, useEffect } from 'react';
import { sendAnalysisPrep, completePrepBooking, completePrepBookingByEmail } from '@/app/actions';

const PREP_ID_KEY = 'mh_prep_submission_id';
const PREP_EMAIL_KEY = 'mh_prep_client_email';
import { site } from '@/lib/site';
import CalendlyWidget from './CalendlyWidget';
import {
  REVENUE_BAND_OPTIONS,
  ENTITY_COUNT_OPTIONS,
  FINANCE_TEAM_SIZE_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  labelForEntityCount,
  labelForFinanceTeamSize,
  labelForRevenueBand,
} from '@/lib/intake-options';

const industryOptions = [
  'Legal & Litigation',
  'Private Equity & Finance',
  'Manufacturing',
  'Technology & SaaS',
  'Healthcare',
  'Real Estate',
  'Professional Services',
  'Restaurant & Hospitality',
  'Online Retail',
  'Other'
];

const challengeOptions = [
  'Balance sheet & account reconciliations taking too long',
  'Month-end close cycle is too slow',
  'Financial data not available to stakeholders/leaders on time',
  'Too many manual processes and spreadsheets',
  'Controls, audit, SOX or compliance issues',
  'Want to automate repetitive finance tasks / use AI tools',
  'Finance team staffing and capacity problems',
  'Cash flow visibility or forecasting issues',
  'Other (please describe)'
];

interface AdditionalChallenge {
  base: string;
  otherText: string;
  submittedValue: string;
}

export default function AnalysisPrepForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState('');
  const [additionalChallenges, setAdditionalChallenges] = useState<AdditionalChallenge[]>([]);
  const [submittedSummary, setSubmittedSummary] = useState('');
  const [showCalendly, setShowCalendly] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [leadSourceOther, setLeadSourceOther] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [referrerEmail, setReferrerEmail] = useState('');

  const getUsedNonOtherChallenges = (excludeIndex?: number): Set<string> => {
    const used = new Set<string>();
    if (selectedChallenge && selectedChallenge !== 'Other (please describe)') {
      used.add(selectedChallenge);
    }
    additionalChallenges.forEach((ch, i) => {
      if (excludeIndex !== undefined && i === excludeIndex) return;
      if (ch.base && ch.base !== 'Other (please describe)') {
        used.add(ch.base);
      }
    });
    return used;
  };

  const addAnotherChallenge = () => {
    setAdditionalChallenges([
      ...additionalChallenges,
      { base: '', otherText: '', submittedValue: '' }
    ]);
  };

  const updateAdditionalBase = (index: number, base: string) => {
    const newList = [...additionalChallenges];
    const item = { ...newList[index], base };
    if (base === 'Other (please describe)') {
      item.submittedValue = item.otherText
        ? `Other (please describe): ${item.otherText}`
        : 'Other (please describe)';
    } else {
      item.submittedValue = base;
      item.otherText = '';
    }
    newList[index] = item;
    setAdditionalChallenges(newList);
  };

  const updateAdditionalOther = (index: number, text: string) => {
    const newList = [...additionalChallenges];
    const item = { ...newList[index], otherText: text };
    item.submittedValue = text
      ? `Other (please describe): ${text}`
      : 'Other (please describe)';
    newList[index] = item;
    setAdditionalChallenges(newList);
  };

  const removeAdditionalChallenge = (index: number) => {
    const newList = additionalChallenges.filter((_, i) => i !== index);
    setAdditionalChallenges(newList);
  };

  // Listen for Calendly booking complete — notify Michael and show thank-you
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const eventName = e.data?.event;
      if (eventName !== 'calendly.event_scheduled') return;

      const storedId = sessionStorage.getItem(PREP_ID_KEY) || '';
      const storedEmail = sessionStorage.getItem(PREP_EMAIL_KEY) || '';
      const id = submissionId || storedId;

      setShowCalendly(false);
      setBookingDone(true);

      const finish = id
        ? completePrepBooking(id)
        : storedEmail
          ? completePrepBookingByEmail(storedEmail)
          : Promise.resolve({ success: false, error: 'Missing booking reference' });

      finish.catch((err) => {
        console.error('Failed to complete prep booking notification:', err);
      });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [submissionId]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError('');
    setIsSuccess(false);

    // === Collect prep answers and build Calendly prefill URL ===
    // This lets the answers travel with the Calendly booking notification (no extra work for the client).
    // User should add a matching "Prep answers / notes from website" custom question as the first custom question in their Calendly event.
    const industry = formData.get('industry') as string || '';
    const revenueBand = formData.get('revenue_band') as string || '';
    const entityCount = formData.get('entity_count') as string || '';
    const financeTeamSize = formData.get('finance_team_size') as string || '';
    const mainCh = formData.get('main_challenge') as string || '';
    const mainChOther = formData.get('main_challenge_other') as string || '';
    const people = labelForFinanceTeamSize(financeTeamSize) || '';
    const success = formData.get('success_looks_like') as string || '';
    const context = formData.get('additional_context') as string || '';
    const addChals = formData.getAll('additional_challenge')
      .map((v) => String(v).trim())
      .filter(Boolean);

    let mainDisplay = mainCh;
    if (mainCh === 'Other (please describe)' && mainChOther) {
      mainDisplay += ` — ${mainChOther}`;
    }

    // Clean multi-line version for the immediate email / attachment (great for humans and SigVai)
    const summary = `Industry / Business Type: ${industry || 'Not provided'}
Approximate annual revenue: ${labelForRevenueBand(revenueBand) || 'Not provided'}
Legal entities: ${labelForEntityCount(entityCount) || 'Not provided'}
Finance team on close/reporting: ${people || 'Not provided'}
Main Challenge Right Now: ${mainDisplay || 'Not provided'}
How many people involved in month-end / reporting: ${people || 'Not provided'}
What does “success” look like in the next 30–90 days: ${success || 'Not provided'}
Any specific deadlines, stakeholders, or upcoming changes: ${context || 'Not provided'}
${addChals.length > 0 ? `Additional challenges:\n${addChals.map((c: string) => `- ${c}`).join('\n')}` : ''}`;

    // Single-line clean version for Calendly prefill (a1) — avoids URL-encoding artifacts like + in the final stored data
    const clientEmail = formData.get('email') as string || '';
    setSubmittedSummary(summary);

    const result = await sendAnalysisPrep(formData);

    if (result.success) {
      if (result.submissionId) {
        setSubmissionId(result.submissionId);
        sessionStorage.setItem(PREP_ID_KEY, result.submissionId);
      }
      if (clientEmail) {
        sessionStorage.setItem(PREP_EMAIL_KEY, clientEmail.trim().toLowerCase());
      }
      setIsSuccess(true);
    } else {
      setError(result.error || 'Something went wrong. Please try again or email us directly.');
    }

    setIsSubmitting(false);
  }

  if (isSuccess) {
    if (bookingDone) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-green-300">Step 2 complete — you&apos;re booked</h2>
            <p className="mt-2 text-sm text-muted">Your 30-minute initial consultation is scheduled.</p>
          </div>
          <div className="bg-green-900/30 border border-green-700 rounded-2xl p-8 text-center">
            <p className="text-green-400 text-lg font-medium">Thank you!</p>
            <p className="text-muted mt-2 text-sm max-w-md mx-auto">
              Your calendar invite is on its way — check your inbox and spam/junk folder for the Calendly email with your meeting time and Teams link.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-green-300">Step 1 complete</h2>
          <p className="mt-2 text-sm text-muted">Step 2 — pick your 30-minute consultation time below.</p>
        </div>
        <div className="bg-green-900/30 border border-green-700 rounded-2xl p-8 text-center">
        <p className="text-muted text-sm max-w-md mx-auto">
          Your confirmation email arrives only after you schedule.
        </p>

        {!showCalendly && (
          <button
            onClick={() => setShowCalendly(true)}
            className="mt-6 inline-block w-full md:w-auto px-5 py-2 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm rounded-full transition-all active:scale-[0.985]"
          >
            Pick a Time & Book
          </button>
        )}

        {showCalendly && (
          <div className="mt-6">
            <CalendlyWidget 
              url={site.calendlyUrl} 
              prefill={{ customAnswers: { a1: submittedSummary } }} 
            />
          </div>
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Step 1 — Your details</h2>
        <p className="mt-2 text-sm text-muted">Helps Michael prepare for your 30-minute consultation.</p>
      </div>
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

      <div className="rounded-xl border border-white/10 bg-[#111827]/60 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-[#e2e8f0]">About your organization</p>
          <p className="text-xs text-muted mt-1">
            Helps us prepare for your consultation. No pricing is shown here.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="revenue_band" className="block text-sm text-muted mb-1.5">Approximate annual revenue</label>
            <select
              id="revenue_band"
              name="revenue_band"
              className="w-full bg-[#0f172a] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm"
            >
              <option value="">Select...</option>
              {REVENUE_BAND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="entity_count" className="block text-sm text-muted mb-1.5">Number of legal entities</label>
            <select
              id="entity_count"
              name="entity_count"
              className="w-full bg-[#0f172a] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm"
            >
              <option value="">Select...</option>
              {ENTITY_COUNT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="finance_team_size" className="block text-sm text-muted mb-1.5">
              Finance team involved in month-end / reporting
            </label>
            <select
              id="finance_team_size"
              name="finance_team_size"
              className="w-full bg-[#0f172a] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm"
            >
              <option value="">Select...</option>
              {FINANCE_TEAM_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
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

      {selectedChallenge === 'Other (please describe)' && (
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

      {/* Smart + Add another challenge (dropdown that avoids duplicates) */}
      <div>
        <button
          type="button"
          onClick={addAnotherChallenge}
          className="text-sm text-accent hover:underline flex items-center gap-1 mb-2"
        >
          + Add another challenge
        </button>

        {additionalChallenges.length > 0 && (
          <div className="space-y-4">
            {additionalChallenges.map((item, index) => {
              const used = getUsedNonOtherChallenges(index);
              const available = challengeOptions.filter(
                (opt) => !used.has(opt) || opt === item.base
              );

              return (
                <div key={index} className="border border-white/10 rounded-lg p-4 bg-[#111827]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm text-muted">Additional challenge</label>
                    <button
                      type="button"
                      onClick={() => removeAdditionalChallenge(index)}
                      className="text-xs text-red-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>

                  <select
                    value={item.base}
                    onChange={(e) => updateAdditionalBase(index, e.target.value)}
                    className="w-full bg-[#0f172a] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm"
                  >
                    <option value="">Select...</option>
                    {available.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>

                  {item.base === 'Other (please describe)' && (
                    <div className="mt-3">
                      <label className="block text-sm text-muted mb-1.5">Please describe</label>
                      <input
                        type="text"
                        value={item.otherText}
                        onChange={(e) => updateAdditionalOther(index, e.target.value)}
                        className="w-full bg-[#0f172a] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
                        placeholder="Describe the other challenge..."
                      />
                    </div>
                  )}

                  {/* Hidden input carries the final value (with description for Other) to the server action */}
                  <input
                    type="hidden"
                    name="additional_challenge"
                    value={item.submittedValue}
                  />
                </div>
              );
            })}
          </div>
        )}
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
        <label htmlFor="additional_context" className="block text-sm text-muted mb-1.5">Any specific deadlines, stakeholders, or upcoming changes we should know about?</label>
        <textarea
          id="additional_context"
          name="additional_context"
          rows={2}
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
          placeholder="e.g. Audit in 6 weeks, new system go-live..."
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111827]/50 p-4 space-y-4">
        <div>
          <label htmlFor="lead_source" className="block text-sm text-muted mb-1.5">
            How did you hear about Michael Hart Consulting?
          </label>
          <p className="text-xs text-subtle mb-2">Optional — helps us understand what is working.</p>
          <select
            id="lead_source"
            name="lead_source"
            value={leadSource}
            onChange={(e) => setLeadSource(e.target.value)}
            className="w-full bg-[#0f172a] border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm"
          >
            <option value="">Select (optional)...</option>
            {LEAD_SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {leadSource === 'referral' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="referrer_name" className="block text-sm text-muted mb-1.5">Referrer&apos;s name</label>
              <input
                id="referrer_name"
                name="referrer_name"
                type="text"
                value={referrerName}
                onChange={(e) => setReferrerName(e.target.value)}
                className="w-full bg-[#0f172a] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
                placeholder="e.g. John Smith"
              />
            </div>
            <div>
              <label htmlFor="referrer_email" className="block text-sm text-muted mb-1.5">Referrer&apos;s email</label>
              <input
                id="referrer_email"
                name="referrer_email"
                type="email"
                value={referrerEmail}
                onChange={(e) => setReferrerEmail(e.target.value)}
                className="w-full bg-[#0f172a] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
                placeholder="Optional — for thank-you if we engage"
              />
            </div>
          </div>
        )}

        {leadSource === 'other' && (
          <div>
            <label htmlFor="lead_source_detail" className="block text-sm text-muted mb-1.5">Please tell us briefly</label>
            <input
              id="lead_source_detail"
              name="lead_source_detail"
              type="text"
              value={leadSourceOther}
              onChange={(e) => setLeadSourceOther(e.target.value)}
              className="w-full bg-[#0f172a] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder:text-subtle focus:outline-none focus:border-accent text-sm"
              placeholder="e.g. Heard you on a podcast, met at an event..."
            />
          </div>
        )}
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
        className="w-full md:w-auto px-5 py-2 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm rounded-full transition-all active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving...' : 'Continue to Booking'}
      </button>
    </form>
    </div>
  );
}
