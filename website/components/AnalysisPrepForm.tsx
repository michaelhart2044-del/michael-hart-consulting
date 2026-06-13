'use client';

import { useState } from 'react';
import { sendAnalysisPrep } from '@/app/actions';
import { site } from '@/lib/site';

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
  const [prefilledCalendlyUrl, setPrefilledCalendlyUrl] = useState('');
  const [submittedSummary, setSubmittedSummary] = useState('');

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

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError('');
    setIsSuccess(false);

    // === Collect prep answers and build Calendly prefill URL ===
    // This lets the answers travel with the Calendly booking notification (no extra work for the client).
    // User should add a matching "Prep answers / notes from website" custom question as the first custom question in their Calendly event.
    const industry = formData.get('industry') as string || '';
    const mainCh = formData.get('main_challenge') as string || '';
    const mainChOther = formData.get('main_challenge_other') as string || '';
    const people = formData.get('people_involved') as string || '';
    const success = formData.get('success_looks_like') as string || '';
    const context = formData.get('additional_context') as string || '';
    const addChals = formData.getAll('additional_challenge')
      .map((v) => String(v).trim())
      .filter(Boolean);

    let mainDisplay = mainCh;
    if (mainCh === 'Other (please describe)' && mainChOther) {
      mainDisplay += ` — ${mainChOther}`;
    }

    const summary = `Industry / Business Type: ${industry || 'Not provided'}
Main Challenge Right Now: ${mainDisplay || 'Not provided'}
How many people involved in month-end / reporting: ${people || 'Not provided'}
What does “success” look like in the next 30–90 days: ${success || 'Not provided'}
Any specific deadlines, stakeholders, or upcoming changes: ${context || 'Not provided'}
${addChals.length > 0 ? `Additional challenges:\n${addChals.map((c: string) => `- ${c}`).join('\n')}` : ''}`;

    const prefilled = `${site.calendlyUrl}?questions[0][value]=${encodeURIComponent(summary)}`;
    setPrefilledCalendlyUrl(prefilled);
    setSubmittedSummary(summary);

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
        <p className="text-green-400 text-lg font-medium">Thank you — your details have been sent.</p>
        <p className="text-muted mt-2">Your answers are pre-filled below in the Calendly booking (they will appear in the booking notification Michael receives).</p>

        {submittedSummary && (
          <div className="mt-4 mb-4 text-left bg-black/30 p-3 rounded text-xs whitespace-pre-wrap font-mono overflow-auto max-h-40">
            {submittedSummary}
          </div>
        )}

        <a
          href={prefilledCalendlyUrl || site.calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block w-full md:w-auto text-center px-5 py-2 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm rounded-full transition-all active:scale-[0.985]"
        >
          Choose your preferred time slot
        </a>
        <p className="text-sm text-subtle mt-4">(opens Calendly with your answers pre-filled)</p>
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
        <label htmlFor="additional_context" className="block text-sm text-muted mb-1.5">Any specific deadlines, stakeholders, or upcoming changes we should know about?</label>
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
        className="w-full md:w-auto px-5 py-2 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm rounded-full transition-all active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send my details & Book Consultation'}
      </button>
    </form>
  );
}
