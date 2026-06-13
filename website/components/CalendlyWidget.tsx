'use client';

import { useState } from 'react';
import { site } from '@/lib/site';

export default function CalendlyWidget({ url }: { url?: string }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div className="text-center py-8">
        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-2 bg-accent hover:bg-accent-hover text-black font-medium rounded-full text-sm transition-all"
        >
          Re-open booking calendar
        </button>
      </div>
    );
  }

  return (
    <div className="relative border border-white/10 rounded-2xl overflow-hidden bg-section">
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-3 right-3 z-10 bg-background/80 hover:bg-background text-accent hover:text-accent-hover rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition-colors"
        aria-label="Close booking calendar"
      >
        ×
      </button>
      <div
        className="calendly-inline-widget"
        data-url={url || site.calendlyUrl}
        style={{ minWidth: '320px', height: '700px' }}
      ></div>
    </div>
  );
}
