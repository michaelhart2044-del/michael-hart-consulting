'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if user hasn't consented yet
    const hasConsent = localStorage.getItem('mh-cookie-consent');
    if (!hasConsent) {
      // Small delay so it doesn't flash on every load
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('mh-cookie-consent', 'accepted');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 bg-background/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center gap-4 text-sm">
        <div className="text-muted flex-1">
          We use essential cookies and analytics tools (such as Google Analytics 4 (GA4) and Microsoft Clarity) to improve your experience and understand site usage.{' '}
          <Link href="/privacy-policy" className="text-accent hover:underline">
            Learn more in our Privacy Policy
          </Link>.
        </div>
        <button
          onClick={accept}
          className="px-6 py-2 bg-accent hover:bg-accent-hover text-black font-medium rounded-full text-sm transition-all whitespace-nowrap"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
