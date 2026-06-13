'use client';

import { useState, useRef, useEffect } from 'react';
import { site } from '@/lib/site';

declare global {
  interface Window {
    Calendly?: any;
  }
}

export default function CalendlyWidget({ url, prefill }: { url?: string; prefill?: any }) {
  const [isOpen, setIsOpen] = useState(true);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  const calendlyUrl = url || site.calendlyUrl;

  useEffect(() => {
    if (!isOpen) return;

    const initWidget = () => {
      if (window.Calendly && widgetContainerRef.current) {
        // Clear any previous content
        widgetContainerRef.current.innerHTML = '';
        const options: any = {
          url: calendlyUrl,
          parentElement: widgetContainerRef.current,
        };
        if (prefill) {
          options.prefill = prefill;
        }
        window.Calendly.initInlineWidget(options);
      }
    };

    // If script already loaded
    if (window.Calendly) {
      initWidget();
    } else {
      // Wait for script to load (the Script tag in page)
      const checkInterval = setInterval(() => {
        if (window.Calendly) {
          clearInterval(checkInterval);
          initWidget();
        }
      }, 100);

      // Fallback timeout
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (window.Calendly) initWidget();
      }, 3000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [isOpen, calendlyUrl, prefill]);

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
        ref={widgetContainerRef}
        style={{ minWidth: '320px', height: '700px' }}
      ></div>
    </div>
  );
}
