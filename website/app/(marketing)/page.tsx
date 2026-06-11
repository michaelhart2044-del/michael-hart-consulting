import Link from 'next/link';
import type { Metadata } from 'next';
import { services } from '@/lib/services';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Expert advisory in forensic accounting, mergers & acquisitions, financial strategy, and AI-powered business solutions. Helping businesses and legal teams make confident decisions.',
  openGraph: {
    title: 'Michael Hart Consulting Group | Forensic Accounting, M&A & AI Advisory',
    description: 'Expert advisory in forensic accounting, mergers & acquisitions, financial strategy, and AI-powered business solutions. Helping businesses and legal teams make confident decisions.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Michael Hart Consulting Group | Forensic Accounting, M&A & AI Advisory',
    description: 'Expert advisory in forensic accounting, mergers & acquisitions, financial strategy, and AI-powered business solutions. Helping businesses and legal teams make confident decisions.',
  },
};

export default function Home() {
  const serviceIcons = [
    (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
        <path d="M8 6v12" /><path d="M16 6v12" />
      </svg>
    ),
    (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 9h6M9 15h6" />
      </svg>
    ),
    (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M3 3v18h18" />
        <path d="M18 17l-5-5-4 4-3-3" />
      </svg>
    ),
    (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h4" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    ),
    (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    )
  ];

  return (
    <>
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-3xl">
          <h1 className="text-[2.45rem] leading-[1.1] md:text-5xl lg:text-6xl font-semibold tracking-[-1.5px]">
            Expert Advisory in Forensic Accounting,<br className="hidden md:block" />M&A, and AI-Powered Business Solutions
          </h1>

          <div className="mt-6 flex justify-center">
            <div className="h-[3px] w-[min(94%,680px)] bg-accent"></div>
          </div>

          <p className="mt-8 text-[15.5px] md:text-lg text-muted leading-relaxed max-w-2xl">
            Combining deep forensic expertise with strategic advisory and intelligent automation to deliver clear, actionable results.
          </p>

          <div className="mt-10 md:mt-12">
            <Link 
              href="/contact" 
              className="inline-block w-full md:w-auto text-center px-8 py-4 bg-accent hover:bg-accent-hover text-black font-medium text-base md:text-lg rounded-full transition-all active:scale-[0.985]"
            >
              Book a Consultation
            </Link>
          </div>
        </div>
      </div>

      {/* Why Work With Us */}
      <section id="why" className="border-t border-white/10 bg-section py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Why Work With Us</h2>
            <p className="mt-4 text-base md:text-lg text-muted">
              We combine deep financial expertise with modern technology to help businesses and legal teams navigate complex challenges with clarity and confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                ),
                title: "Proven in Complex Matters",
                desc: "Deep experience in forensic accounting, litigation support, mergers & acquisitions, and high-stakes financial advisory."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
                title: "Expertise + Technology",
                desc: "We blend traditional financial expertise with AI and automation to deliver faster, clearer, and more actionable insights."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                ),
                title: "Clear and Actionable Outcomes",
                desc: "We don’t just analyze — we help you make confident decisions with practical recommendations and measurable results."
              }
            ].map((item, i) => (
              <div 
                key={i} 
                className="group border border-white/10 rounded-2xl p-6 bg-card hover:border-accent/40 hover:bg-[#111827] transition-all duration-300 flex flex-col"
              >
                <div className="mb-4 text-accent group-hover:text-accent-hover group-hover:scale-110 transition-all duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-accent transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted flex-grow">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section id="services" className="border-t border-white/10 bg-background py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Our Services</h2>
            <p className="mt-4 text-base md:text-lg text-muted">
              We provide specialized advisory across complex financial, strategic, and operational challenges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* DRY: services data imported from lib/services.ts (source of truth).
                No hardcoded titles/descriptions here. Icons kept local for presentation only. */}
            {services.map((service, i) => (
              <Link 
                key={service.slug} 
                href={`/services/${service.slug}`}
                className="group border border-white/10 rounded-2xl p-6 bg-card hover:border-accent/40 hover:bg-[#111827] transition-all duration-300 flex flex-col no-underline"
              >
                <div className="mb-4 text-accent group-hover:text-accent-hover group-hover:scale-110 transition-all duration-300">
                  {serviceIcons[i]}
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-accent transition-colors">
                  {service.title}
                </h3>
                <p className="text-muted flex-grow">
                  {service.shortDesc}
                </p>
                <div className="mt-auto pt-3 text-sm text-accent group-hover:underline">Learn more →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="border-t border-white/10 bg-section py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-card border border-white/10 rounded-2xl p-10 md:p-12 text-center hover:border-accent/30 transition-all duration-300">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to Get Started?</h2>
            <p className="mt-4 text-base md:text-lg text-muted max-w-xl mx-auto">
              Whether you're facing a complex challenge or planning your next strategic move, we’re here to help you move forward with clarity.
            </p>

            <div className="mt-10">
              <Link 
                href="/contact" 
                className="inline-block px-10 py-4 bg-accent hover:bg-accent-hover text-black font-medium text-lg rounded-full transition-all active:scale-[0.985]"
              >
                Book a Consultation
              </Link>
            </div>

            <p className="mt-8 text-sm text-subtle">
              Or call us directly at <span className="text-muted font-medium">(747) 370-9393</span>
            </p>
          </div>
        </div>
      </section>

    </>
  );
}