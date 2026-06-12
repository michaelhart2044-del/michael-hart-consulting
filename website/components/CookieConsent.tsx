'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if user hasn't made a choice yet
    const consent = localStorage.getItem('mh-cookie-consent');
    if (!consent) {
      // Small delay so it doesn't flash on every load
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('mh-cookie-consent', 'accepted');
    setShow(false);
    // Notify any listeners (e.g. Analytics component) to load scripts immediately
    window.dispatchEvent(new CustomEvent('mh-cookie-consent'));
  };

  const decline = () => {
    localStorage.setItem('mh-cookie-consent', 'declined');
    setShow(false);
    window.dispatchEvent(new CustomEvent('mh-cookie-consent'));
  };

  // Task #11 redo: GA4 + Clarity properly gated behind explicit consent (re-deploy for visibility)

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 bg-background/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center gap-4 text-sm">
        <div className="text-muted flex-1">
          We use essential cookies for basic site functionality. With your consent we also load analytics tools (Google Analytics 4 and Microsoft Clarity) to understand usage and improve the experience.{' '}
          <Link href="/privacy-policy" className="text-accent hover:underline">
            Learn more in our Privacy Policy
          </Link>.
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={decline}
            className="px-5 py-2 border border-white/20 hover:bg-white/5 text-foreground font-medium rounded-full text-sm transition-all whitespace-nowrap"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-6 py-2 bg-accent hover:bg-accent-hover text-black font-medium rounded-full text-sm transition-all whitespace-nowrap"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
