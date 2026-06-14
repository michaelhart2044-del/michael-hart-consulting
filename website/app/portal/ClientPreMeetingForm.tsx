'use client';

import { useState, useTransition } from 'react';
import { savePreMeetingDiscovery } from '@/app/actions';
import { analysisQuestions } from '@/lib/analysis-questions';

interface Props {
  initialData: any; // the submission for display
}

export default function ClientPreMeetingForm({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Client-friendly questions: use the existing ones (great for DMAIC prep) + 2 extras
  // Labels/prompts kept professional and clear - no internal terms shown to client.
  const questions = [
    ...analysisQuestions,
    {
      id: 'processOwners',
      number: 8,
      label: 'Process owners and key stakeholders',
      prompt: 'Who owns each part of the close/reporting processes? Who are the main decision-makers or approvers for changes?',
    },
    {
      id: 'currentMetrics',
      number: 9,
      label: 'Current metrics and visibility',
      prompt: 'What KPIs, reports, or performance measures are tracked today (if any)? How do you currently know if processes are working well?',
    },
  ];

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      const discovery: any = { ...answers };
      if (notes.trim()) discovery.additionalNotes = notes.trim();

      const result = await savePreMeetingDiscovery(discovery);
      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    });
  };

  if (saved) {
    return (
      <div className="text-center py-8">
        <p className="text-[#c5a46e] font-medium">Your answers have been saved.</p>
        <p className="text-sm text-[#94a3b8] mt-2">Michael now has a complete picture. Use the button on the main page to book your meeting.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {questions.map((q) => (
        <div key={q.id} className="border border-white/10 rounded-xl p-4 bg-black/10">
          <label className="block font-medium mb-1 text-sm">{q.label}</label>
          <p className="text-xs text-[#94a3b8] mb-2">{q.prompt}</p>
          <textarea
            required
            rows={3}
            className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#c5a46e]"
            placeholder="Your answer..."
            value={answers[q.id] || ''}
            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
          />
        </div>
      ))}

      <div className="border border-white/10 rounded-xl p-4 bg-black/10">
        <label className="block font-medium mb-1 text-sm">Any other details or context for the meeting?</label>
        <textarea
          rows={4}
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#c5a46e]"
          placeholder="Optional additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full md:w-auto px-6 py-3 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm rounded-full transition-all disabled:opacity-60"
      >
        {isPending ? 'Saving your answers...' : 'Save and Continue to Meeting Booking'}
      </button>

      <p className="text-xs text-[#64748b]">Your answers are private and will only be used to prepare for your engagement.</p>
    </form>
  );
}
