import type { Metadata } from 'next';
import Link from 'next/link';
import AnalysisPrepForm from '@/components/AnalysisPrepForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Prepare for Your AI-Powered Process Analysis',
  description: 'Get the key discovery questions in advance. Answer async before the call or come prepared. Submit your responses and we\'ll send everything to Michael before your 30-min session.',
  openGraph: {
    title: 'Prepare for Your AI-Powered Process Analysis | ' + site.name,
    description: 'Answer the questions that drive a precise, high-value 30-min analysis. Submit in advance (async option available) or use them to prepare for the live call.',
    images: [
      {
        url: site.ogImage,
        width: 1200,
        height: 630,
        alt: `${site.name} - Prepare for Your AI-Powered Process Analysis`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prepare for Your AI-Powered Process Analysis | ' + site.name,
    description: 'Answer the questions that drive a precise, high-value 30-min analysis. Submit in advance (async option available) or use them to prepare for the live call.',
    images: [site.ogImage],
  },
};

export default function PrepareAnalysis() {
  return (
    <>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-12">
        <div className="max-w-3xl">
          <div className="text-accent text-sm tracking-[1.5px] font-medium mb-3">FREE 30-MIN SESSION</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-1.25px] leading-tight">
            Prepare for Your<br />AI-Powered Process Analysis
          </h1>
          <p className="mt-6 text-lg text-muted max-w-2xl">
            These 7 targeted questions are the exact ones we use to understand your close, operations, controls, and automation landscape. 
            Answer any or all in advance (or just review them) so our time is spent on insights and concrete next steps instead of basic discovery.
          </p>
          <div className="mt-4 text-sm text-muted">
            You can submit here and still book the call, or book first and come prepared. Async-only responses are also welcome.
          </div>
        </div>
      </div>

      {/* The form */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="max-w-3xl">
          <AnalysisPrepForm />
        </div>
      </div>

      {/* Secondary option + value reminder */}
      <div className="border-t border-white/10 bg-section py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Prefer to book first?</h2>
            <p className="text-muted mb-6">
              No problem. Use the questions above to get ready, or just schedule now and we&apos;ll walk through them live. 
              Either way, you&apos;ll get far more out of the 30 minutes.
            </p>
            <a
              href={site.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3.5 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium rounded-full transition-all active:scale-[0.985]"
            >
              Book the 30-min AI-Powered Process Analysis directly
            </a>
            <p className="mt-3 text-xs text-subtle">
              (Calendly opens in a new tab)
            </p>
          </div>
        </div>
      </div>

      {/* Why these questions + next steps */}
      <div className="max-w-5xl mx-auto px-6 py-16 border-t border-white/10">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Why this matters</h2>
          <ul className="space-y-3 text-muted text-[15px]">
            <li className="flex gap-3"><span className="text-accent mt-1">•</span> We come to the call already aligned on your reality instead of asking basic questions.</li>
            <li className="flex gap-3"><span className="text-accent mt-1">•</span> You get a higher-signal 30 minutes focused on opportunities, quick wins, and whether a deeper engagement makes sense.</li>
            <li className="flex gap-3"><span className="text-accent mt-1">•</span> If you decide to move forward, the same structured answers let us generate a precise, tailored proposal immediately.</li>
          </ul>

          <div className="mt-10 text-sm text-muted">
            Have questions before booking? <Link href="/contact" className="text-accent hover:underline">Reach out here</Link> or call <a href={site.phoneHref} className="text-accent hover:underline">{site.phone}</a>.
          </div>
        </div>
      </div>
    </>
  );
}
