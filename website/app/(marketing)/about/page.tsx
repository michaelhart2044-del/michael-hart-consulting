import Link from 'next/link';
import type { Metadata } from 'next';
import { site } from '@/lib/site';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About',
  description: `Learn about ${site.name}. Our team provides expert forensic accounting, litigation support, mergers & acquisitions advisory, financial forecasting, and AI & automation solutions.`,
  openGraph: {
    title: `About | ${site.name}`,
    description: `Learn about ${site.name}. Our team provides expert forensic accounting, litigation support, mergers & acquisitions advisory, financial forecasting, and AI & automation solutions.`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `About | ${site.name}`,
    description: `Learn about ${site.name}. Our team provides expert forensic accounting, litigation support, mergers & acquisitions advisory, financial forecasting, and AI & automation solutions.`,
  },
};

export default function About() {
  return (
    <>
      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-semibold tracking-[-1px] leading-tight">
            About {site.name}
          </h1>
          <p className="mt-4 text-lg text-muted">
            We help businesses and legal teams navigate complex financial challenges with clarity, precision, and strategic insight.
          </p>
        </div>
      </div>

      {/* Founder */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-card">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            <div className="flex-shrink-0 w-28 h-28 md:w-32 md:h-32 rounded-full border border-accent/30 overflow-hidden">
              <Image 
                src="/mh-logo.png" 
                alt="Michael Hart Consulting Group LLC logo" 
                width={128} 
                height={128} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1">
              <div>
                <div className="font-semibold text-2xl">Michael Hart</div>
                <div className="text-accent text-sm tracking-[2px] mt-0.5">FOUNDER &amp; PRINCIPAL</div>
              </div>
              <p className="mt-4 text-muted leading-relaxed">
                Michael Hart founded the firm with a clear mission: to bring the rigor of forensic accounting and the clarity of strategic advisory to organizations facing their most complex challenges. With decades of hands-on experience advising boards, legal teams, and executives, he combines traditional financial discipline with modern analytics and AI to deliver practical, defensible results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Who We Are */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-card">
          <h2 className="text-3xl font-semibold mb-6">Who We Are</h2>
          <p className="text-lg text-muted leading-relaxed">
            Michael Hart Consulting Group LLC was founded with a clear mission: to deliver high-quality, practical advisory services that help organizations solve complex problems and make confident decisions.
          </p>
          <p className="mt-6 text-lg text-muted leading-relaxed">
            With deep expertise in forensic accounting, mergers and acquisitions, financial strategy, and AI-driven solutions, we bring both traditional financial discipline and modern technology to every engagement.
          </p>
        </div>
      </div>

      {/* Experience & Expertise */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-card">
          <h2 className="text-3xl font-semibold mb-6">Experience &amp; Expertise</h2>
          
          <p className="text-lg text-muted leading-relaxed mb-6">
            With decades of hands-on experience, Michael Hart brings unmatched depth to complex financial disputes, transactions, and strategic advisory.
          </p>

          <div className="space-y-4 text-muted">
            <div>
              <div className="font-medium text-foreground mb-1">Forensic Accounting &amp; Litigation Support</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Expert analysis and testimony in high-stakes litigation, fraud investigations, and arbitration matters</li>
                <li>Damage calculations, lost profits analysis, and financial statement reconstruction for law firms, corporations, and government agencies</li>
              </ul>
            </div>

            <div>
              <div className="font-medium text-foreground mb-1">Mergers &amp; Acquisitions Advisory</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Buy-side and sell-side due diligence, quality of earnings reviews, and valuation support</li>
                <li>Transaction structuring and post-close integration for private equity and strategic acquirers</li>
              </ul>
            </div>

            <div>
              <div className="font-medium text-foreground mb-1">Financial Strategy &amp; AI-Driven Solutions</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Driver-based forecasting, scenario planning, and board-level financial advisory</li>
                <li>Practical implementation of AI and automation in finance, accounting, and advisory workflows</li>
              </ul>
            </div>
          </div>

          {/* Industries Served - trust signal */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-xs tracking-[2px] text-accent mb-3">INDUSTRIES SERVED</div>
            <div className="flex flex-wrap gap-2">
              {['Legal & Litigation', 'Private Equity & Finance', 'Manufacturing', 'Technology & SaaS', 'Healthcare', 'Real Estate', 'Professional Services'].map((industry) => (
                <span
                  key={industry}
                  className="inline-block px-3 py-1 text-xs border border-white/10 rounded-full text-muted hover:border-accent/40 hover:text-accent transition-colors"
                >
                  {industry}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Education & Credentials */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-card">
          <h2 className="text-3xl font-semibold mb-6">Education &amp; Credentials</h2>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 text-muted">
            <div>
              <div className="font-medium text-foreground mb-2">Professional Certifications</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Certified Public Accountant (CPA)</li>
                <li>Certified in Financial Forensics (CFF)</li>
                <li>Certified Fraud Examiner (CFE)</li>
                <li>Accredited in Business Valuation (ABV)</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-foreground mb-2">Education</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Master of Science in Accounting / Finance</li>
                <li>Bachelor of Science in Accounting</li>
                <li>Advanced training in forensic investigation and data analytics</li>
              </ul>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted">
            These qualifications reflect decades of specialized work in forensic accounting, complex litigation, and high-value advisory.
          </p>
        </div>
      </div>

      {/* Our Approach */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-card">
          <h2 className="text-3xl font-semibold mb-6">Our Approach</h2>
          <p className="text-lg text-muted leading-relaxed">
            We believe that great advisory work is built on three pillars: deep expertise, clear communication, and practical results. 
            We don’t just deliver reports — we partner with our clients to understand their goals and help them achieve measurable outcomes.
          </p>
          <p className="mt-6 text-lg text-muted leading-relaxed">
            Every engagement is approached with integrity, discretion, and a commitment to excellence.
          </p>
        </div>
      </div>

      {/* Clear CTA */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-white/10 rounded-2xl p-10 md:p-12 text-center hover:border-accent/30 transition-all duration-300">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to discuss your challenges?</h2>
            <p className="mt-4 text-base md:text-lg text-muted max-w-xl mx-auto">
              Whether you're preparing for litigation, evaluating a transaction, or modernizing financial processes, we’re here to help.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-block px-10 py-4 bg-accent hover:bg-accent-hover text-black font-medium text-lg rounded-full transition-all active:scale-[0.985]"
              >
                Book a Consultation
              </Link>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}