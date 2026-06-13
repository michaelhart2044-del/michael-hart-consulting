import type { Metadata } from 'next';
import Link from 'next/link';
import AnalysisPrepForm from '@/components/AnalysisPrepForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Prepare for Your Initial Consultation',
  description: 'Book a 30-minute initial consultation. Optionally share a few details in advance to help us prepare.',
  openGraph: {
    title: 'Prepare for Your Initial Consultation | ' + site.name,
    description: 'Book your initial consultation. Optionally share industry, main challenge, and a couple of details so we can make the most of our time together.',
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
    description: 'Book your initial consultation. Optionally share industry, main challenge, and a couple of details so we can make the most of our time together.',
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
            Book a 30-minute call to discuss your finance operations. To help us prepare and make the most of our time, you can optionally share a few details below first.
          </p>
        </div>

        <div className="mt-8">
          <a
            href={site.calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full md:w-auto px-6 py-2.5 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-sm md:text-base rounded-full transition-all active:scale-[0.985]"
          >
            Book Initial Consultation
          </a>
          <p className="mt-2 text-xs text-subtle">(opens Calendly in a new tab)</p>
        </div>
      </div>

      {/* Optional smart intake form */}
      <div className="border-t border-white/10 bg-section py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="mb-6">
              <div className="text-sm text-accent tracking-widest font-medium mb-2">OPTIONAL</div>
              <h2 className="text-2xl font-semibold tracking-tight">Share a few details in advance</h2>
              <p className="mt-2 text-sm text-muted">This helps us come prepared. You can book without filling anything out.</p>
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
    </>
  );
}
