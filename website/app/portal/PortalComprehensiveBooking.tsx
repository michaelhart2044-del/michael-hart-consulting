'use client';

import { useState } from 'react';
import CalendlyWidget from '@/components/CalendlyWidget';
import { PORTAL_BOOKING_HEADING, PORTAL_BOOKING_INTRO } from '@/lib/portal-client-copy';
import { site } from '@/lib/site';

interface Props {
  name: string;
  email: string;
}

export default function PortalComprehensiveBooking({ name, email }: Props) {
  const [showWidget, setShowWidget] = useState(false);

  return (
    <section className="border border-white/10 bg-[#0f172a] p-6 rounded-2xl space-y-4">
      <h2 className="font-semibold text-lg">{PORTAL_BOOKING_HEADING}</h2>
      <p className="text-sm text-[#94a3b8]">
        {PORTAL_BOOKING_INTRO}
      </p>

      {!showWidget ? (
        <button
          type="button"
          onClick={() => setShowWidget(true)}
          className="inline-block px-6 py-3 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm rounded-full transition-all"
        >
          Pick a Time — 1-Hour Meeting
        </button>
      ) : (
        <CalendlyWidget
          url={site.comprehensiveCalendlyUrl}
          prefill={{ name, email }}
        />
      )}
    </section>
  );
}