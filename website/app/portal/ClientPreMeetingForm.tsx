'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { savePreMeetingDiscovery } from '@/app/actions';
import { PORTAL_PREP_INTRO } from '@/lib/portal-client-copy';
import { portalPrepQuestions } from '@/lib/portal-prep-questions';

interface Props {
  initialData: { name: string; email: string };
}

export default function ClientPreMeetingForm({ initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    for (const q of portalPrepQuestions) {
      if (!q.required || q.type !== 'multiselect') continue;
      if (!(multiAnswers[q.id]?.length)) {
        setError(`Please select at least one option for "${q.label}".`);
        return;
      }
    }

    startTransition(async () => {
      const discovery: Record<string, string> = { ...answers };
      for (const [key, values] of Object.entries(multiAnswers)) {
        if (values.length > 0) {
          discovery[key] = values.join('; ');
        }
      }

      const result = await savePreMeetingDiscovery(discovery);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    });
  };

  const toggleMulti = (id: string, option: string) => {
    setMultiAnswers((prev) => {
      const current = prev[id] || [];
      const next = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option];
      return { ...prev, [id]: next };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-[#94a3b8]">
        {PORTAL_PREP_INTRO}
      </p>

      {portalPrepQuestions.map((q) => (
        <div key={q.id} className="border border-white/10 rounded-xl p-4 bg-black/10">
          <label className="block font-medium mb-1 text-sm" htmlFor={q.type === 'select' ? q.id : undefined}>
            {q.label}
            {q.required ? ' *' : ''}
          </label>
          {q.helper && <p className="text-xs text-[#64748b] mb-2">{q.helper}</p>}

          {q.type === 'select' && q.options && (
            <select
              id={q.id}
              required={q.required}
              className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#c5a46e]"
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            >
              <option value="">Select one…</option>
              {q.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {q.type === 'multiselect' && q.options && (
            <div className="flex flex-wrap gap-2 mt-1">
              {q.options.map((opt) => {
                const selected = (multiAnswers[q.id] || []).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMulti(q.id, opt)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selected
                        ? 'bg-[#8f6f3d]/30 border-[#c5a46e]/60 text-[#f1f5f9]'
                        : 'border-white/20 text-[#94a3b8] hover:border-white/40'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'shorttext' && (
            <textarea
              rows={3}
              className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#c5a46e]"
              placeholder={q.placeholder || 'Optional…'}
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            />
          )}

          {q.options?.some((o) => o.includes('Other')) &&
            (answers[q.id]?.includes('Other') || (multiAnswers[q.id] || []).some((v) => v.includes('Other'))) && (
              <input
                type="text"
                className="mt-2 w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#c5a46e]"
                placeholder="Please describe…"
                value={answers[`${q.id}_other`] || ''}
                onChange={(e) => setAnswers({ ...answers, [`${q.id}_other`]: e.target.value })}
              />
            )}
        </div>
      ))}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full md:w-auto px-6 py-3 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm rounded-full transition-all disabled:opacity-60"
      >
        {isPending ? 'Saving…' : 'Save & Schedule 1-Hour Meeting'}
      </button>

      <p className="text-xs text-[#64748b]">
        Signed in as {initialData.name} ({initialData.email}). Answers are private.
      </p>
    </form>
  );
}