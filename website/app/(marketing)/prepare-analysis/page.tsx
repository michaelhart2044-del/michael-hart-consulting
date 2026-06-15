import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import AnalysisPrepForm from '@/components/AnalysisPrepForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Prepare for Your Initial Consultation',
  description: 'Book a 30-minute initial consultation. Share a few details in advance to help us prepare.',
  openGraph: {
    title: 'Prepare for Your Initial Consultation | ' + site.name,
    description: 'Book your initial consultation. Share industry, main challenge, and a couple of details so we can make the most of our time together.',
    images: [
      {
        url: site.ogImage,
        width: 1200,
        height: 630,
        alt: `${site.name} - Prepare for Your Initial Consultation`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prepare for Your Initial Consultation | ' + site.name,
    description: 'Book your initial consultation. Share industry, main challenge, and a couple of details so we can make the most of our time together.',
    images: [site.ogImage],
  },
};

export default function PrepareAnalysis() {
  return (
    <>
      {/* Header + primary book button (compact, elegant) */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-1.25px] leading-tight">
            Prepare for Your Initial Consultation
          </h1>
          <p className="mt-6 text-[15px] md:text-lg text-muted leading-relaxed">
            Two steps: share your details, then pick a time. Takes about 3 minutes.
          </p>
        </div>
      </div>

      {/* Smart intake form */}
      <div className="border-t border-white/10 bg-section py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Step 1 — Your details</h2>
              <p className="mt-2 text-sm text-muted">Helps Michael prepare for your 30-minute consultation.</p>
            </div>
            <AnalysisPrepForm />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 border-t border-white/10">
        <p className="text-sm text-muted">
          Questions? <Link href="/contact" className="text-accent hover:underline">Contact us</Link> or call <a href={site.phoneHref} className="text-accent hover:underline">{site.phone}</a>.
        </p>
      </div>

      {/* Calendly script for inline widget in prep success flow */}
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
    </>
  );
}
