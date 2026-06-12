import Link from 'next/link';
import type { Metadata } from 'next';
import { services } from '@/lib/services';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Home',
  description: site.description,
  openGraph: {
    title: `${site.name} | Strategic Financial Advisory`,
    description: site.description,
    images: [
      {
        url: site.ogImage,
        width: 1200,
        height: 630,
        alt: `${site.name} - ${site.tagline}`,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} | Strategic Financial Advisory`,
    description: site.description,
    images: [site.ogImage],
  },
};

export default function Home() {
  const serviceIcons = [
    (
      <svg key="icon-0" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
        <path d="M8 6v12" /><path d="M16 6v12" />
      </svg>
    ),
    (
      <svg key="icon-1" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 9h6M9 15h6" />
      </svg>
    ),
    (
      <svg key="icon-2" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    (
      <svg key="icon-3" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M3 3v18h18" />
        <path d="M18 17l-5-5-4 4-3-3" />
      </svg>
    ),
    (
      <svg key="icon-4" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h4" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    ),
    (
      <svg key="icon-5" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
    // 7. Revenue Accounting & Compliance
    (
      <svg key="icon-6" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8M16 17H8" />
      </svg>
    ),
    // 8. Month-End Close & Financial Reporting
    (
      <svg key="icon-7" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    // 9. SOX Controls & Audit Support
    (
      <svg key="icon-8" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    // 10. Process Automation & Finance Transformation
    (
      <svg key="icon-9" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-1.34 3-3m-3 3v-3" />
      </svg>
    ),
    // 11. AI-Assisted Software Development
    (
      <svg key="icon-10" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    // 12. Finance Function Transformation & Leadership
    (
      <svg key="icon-11" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  ];

  return (
    <>
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-3xl">
          <h1 className="text-[2rem] leading-[1.05] md:text-4xl lg:text-5xl font-semibold tracking-[-1.25px]">
            Expert Financial Advisory:<br className="hidden md:block" /> Operations, Controls &amp; Automation
          </h1>

          <p className="mt-6 text-[15px] md:text-lg text-muted leading-relaxed max-w-2xl">
            Results-driven expertise transforming financial operations through reporting, close processes, controls, automation, and strategic leadership.
          </p>

          <div className="mt-10 md:mt-12">
            <Link 
              href="/contact#book" 
              className="inline-block w-full md:w-auto text-center px-8 py-4 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-base md:text-lg rounded-full transition-all active:scale-[0.985]"
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
              We bring extensive hands-on experience in financial reporting, revenue accounting, month-end close, reconciliations, audit support, and process optimization to help organizations achieve efficiency, accuracy, and compliance with Generally Accepted Accounting Principles (GAAP) as the standard.
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
                title: "Proven in Complex Financial Operations",
                desc: "Extensive experience across public, private, and PE-backed organizations in financial reporting, month-end close, revenue accounting, reconciliations, SOX controls, and audit support — all grounded in Generally Accepted Accounting Principles (GAAP) as the standard."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
                title: "Expertise in Automation & Controls",
                desc: "Transforming manual, time-intensive processes into automated, scalable workflows using SQL, Power Query, Power BI, and modern ERP tools. Leading Six Sigma Black Belt projects to strengthen controls and elevate efficiency."
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
                desc: "We don’t just analyze — we partner cross-functionally with revenue, FP&A, and operations to deliver practical recommendations, measurable efficiency gains, and team leadership that drive confident decisions."
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

      {/* Client Results & Social Proof */}
      <section className="border-t border-white/10 bg-background py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Results That Speak for Themselves</h2>
            <p className="mt-4 text-base md:text-lg text-muted">
              Measurable impact from transforming financial operations, automating processes, and strengthening controls across organizations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Michael helped us reduce our month-end close cycle from 25 days to just 5 business days through process standardization and automation. A true game-changer for our entire finance team.",
                attribution: "Controller, Multi-Location Healthcare Provider"
              },
              {
                quote: "By designing SQL and Power Query automation, our monthly reconciliations went from taking 6 hours to under 15 minutes. Massive time savings and dramatically improved accuracy.",
                attribution: "Finance Manager, PE-Backed Technology Company"
              },
              {
                quote: "We built our AP/AR departments from the ground up with Michael's guidance. He also automated our long-term contract workflows using Salesforce, saving the team hours every week.",
                attribution: "CFO, Manufacturing & Distribution Firm"
              }
            ].map((item, i) => (
              <div 
                key={i} 
                className="group border border-white/10 rounded-2xl p-6 bg-card hover:border-accent/40 hover:bg-[#111827] transition-all duration-300 flex flex-col"
              >
                <div className="text-4xl text-accent mb-4">“</div>
                <p className="text-muted flex-grow leading-relaxed">
                  {item.quote}
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 text-sm text-subtle">
                  {item.attribution}
                </div>
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
              We provide specialized advisory in revenue accounting, financial close, controls, process automation, AI-assisted software development, finance function transformation, forecasting, and AI solutions across complex organizations.
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
              Whether you&apos;re facing a complex challenge or planning your next strategic move, we&apos;re here to help you move forward with clarity.
            </p>

            <div className="mt-10">
              <Link 
                href="/contact#book" 
                className="inline-block px-10 py-4 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-lg rounded-full transition-all active:scale-[0.985]"
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