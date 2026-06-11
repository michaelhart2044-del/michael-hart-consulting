import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Michael Hart Consulting Group LLC. Our team provides expert forensic accounting, litigation support, mergers & acquisitions advisory, financial forecasting, and AI & automation solutions.',
  openGraph: {
    title: 'About | Michael Hart Consulting Group',
    description: 'Learn about Michael Hart Consulting Group LLC. Our team provides expert forensic accounting, litigation support, mergers & acquisitions advisory, financial forecasting, and AI & automation solutions.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About | Michael Hart Consulting Group',
    description: 'Learn about Michael Hart Consulting Group LLC. Our team provides expert forensic accounting, litigation support, mergers & acquisitions advisory, financial forecasting, and AI & automation solutions.',
  },
};

export default function About() {
  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9]">
      <Navbar />

      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-semibold tracking-[-1px] leading-tight">
            About Michael Hart Consulting Group LLC
          </h1>
          <p className="mt-4 text-lg text-[#94a3b8]">
            We help businesses and legal teams navigate complex financial challenges with clarity, precision, and strategic insight.
          </p>
        </div>
      </div>

      {/* Founder */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-card">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            <div className="w-20 h-20 rounded-full border border-accent/30 bg-[#0a0f2c] flex-shrink-0 flex items-center justify-center">
              <span className="text-accent text-3xl font-semibold tracking-[-1.5px]">MH</span>
            </div>
            <div className="flex-1">
              <div>
                <div className="font-semibold text-2xl">Michael Hart</div>
                <div className="text-accent text-sm tracking-[2px] mt-0.5">FOUNDER &amp; PRINCIPAL</div>
              </div>
              <p className="mt-4 text-[#94a3b8] leading-relaxed">
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
          <p className="text-lg text-[#94a3b8] leading-relaxed">
            Michael Hart Consulting Group LLC was founded with a clear mission: to deliver high-quality, practical advisory services that help organizations solve complex problems and make confident decisions.
          </p>
          <p className="mt-6 text-lg text-[#94a3b8] leading-relaxed">
            With deep expertise in forensic accounting, mergers and acquisitions, financial strategy, and AI-driven solutions, we bring both traditional financial discipline and modern technology to every engagement.
          </p>
        </div>
      </div>

      {/* Experience & Expertise */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-card">
          <h2 className="text-3xl font-semibold mb-6">Experience &amp; Expertise</h2>
          <p className="text-lg text-[#94a3b8] leading-relaxed">
            Our work spans a wide range of complex matters, including litigation support, financial investigations, business restructuring, M&amp;A due diligence, and strategic financial planning. 
            We have advised business owners, executives, legal teams, and investors across multiple industries.
          </p>
          <p className="mt-6 text-lg text-[#94a3b8] leading-relaxed">
            We combine decades of hands-on experience with modern tools — including data analytics and AI — to deliver faster, clearer, and more actionable results.
          </p>

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

      {/* Our Approach */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-card">
          <h2 className="text-3xl font-semibold mb-6">Our Approach</h2>
          <p className="text-lg text-[#94a3b8] leading-relaxed">
            We believe that great advisory work is built on three pillars: deep expertise, clear communication, and practical results. 
            We don’t just deliver reports — we partner with our clients to understand their goals and help them achieve measurable outcomes.
          </p>
          <p className="mt-6 text-lg text-[#94a3b8] leading-relaxed">
            Every engagement is approached with integrity, discretion, and a commitment to excellence.
          </p>
        </div>
      </div>

      {/* Clear CTA */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-white/10 rounded-2xl p-10 md:p-12 text-center hover:border-accent/30 transition-all duration-300">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to discuss your challenges?</h2>
            <p className="mt-4 text-base md:text-lg text-[#94a3b8] max-w-xl mx-auto">
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

      <Footer />
    </div>
  );
}