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
            {/* DRY: services data (including icons) imported from lib/services.ts (source of truth).
                No hardcoded titles, descriptions or icons here. Icons now live with their service data to eliminate brittle index coupling. */}
            {services.map((service) => (
              <Link 
                key={service.slug} 
                href={`/services/${service.slug}`}
                className="group border border-white/10 rounded-2xl p-6 bg-card hover:border-accent/40 hover:bg-[#111827] transition-all duration-300 flex flex-col no-underline"
              >
                <div className="mb-4 text-accent group-hover:text-accent-hover group-hover:scale-110 transition-all duration-300">
                  {service.icon}
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

      {/* FAQ Section for SEO and user clarity */}
      <section id="faq" className="border-t border-white/10 bg-background py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Frequently Asked Questions</h2>
            <p className="mt-4 text-base md:text-lg text-muted">
              Answers to common questions about my advisory services, approach, and how we can work together.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "What services do you specialize in?",
                a: "I advise on revenue accounting and compliance, month-end close and financial reporting, SOX controls and audit support, process automation, AI-assisted development, and overall finance function transformation and leadership.",
              },
              {
                q: "Who do you typically work with?",
                a: "Finance teams at public companies, PE-backed businesses, and growing organizations across healthcare, technology, manufacturing, distribution, and professional services. Engagements range from targeted fixes to multi-month transformations.",
              },
              {
                q: "What does a typical engagement look like?",
                a: "We start with a discovery call to understand your challenges and goals. I then deliver hands-on work—process redesign, automation, controls implementation, or reporting improvements—with clear milestones and measurable results.",
              },
              {
                q: "How long do projects usually take?",
                a: "It depends on scope. Focused close acceleration or automation projects often run 4–12 weeks. Broader finance transformation or ongoing advisory support can last several months on a project or retainer basis.",
              },
              {
                q: "Do you work remotely or on-site?",
                a: "I am flexible. Most work today is done remotely using secure collaboration tools, but I can support on-site or hybrid arrangements when it adds the most value.",
              },
              {
                q: "How do I get started?",
                a: "Book a no-obligation 30-minute consultation directly on the contact page, or call me at (747) 370-9393. We’ll discuss your situation and determine the best path forward.",
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group border border-white/10 rounded-2xl bg-card open:bg-[#111827] transition-colors duration-200"
              >
                <summary className="cursor-pointer list-none px-6 py-5 font-medium text-lg flex justify-between items-center hover:text-accent transition-colors">
                  {faq.q}
                  <span className="text-accent text-2xl leading-none transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div className="px-6 pb-6 text-muted leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FAQPage Structured Data for SEO (matches the visible FAQ section) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What services do you specialize in?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'I advise on revenue accounting and compliance, month-end close and financial reporting, SOX controls and audit support, process automation, AI-assisted development, and overall finance function transformation and leadership.',
                },
              },
              {
                '@type': 'Question',
                name: 'Who do you typically work with?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Finance teams at public companies, PE-backed businesses, and growing organizations across healthcare, technology, manufacturing, distribution, and professional services. Engagements range from targeted fixes to multi-month transformations.',
                },
              },
              {
                '@type': 'Question',
                name: 'What does a typical engagement look like?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We start with a discovery call to understand your challenges and goals. I then deliver hands-on work—process redesign, automation, controls implementation, or reporting improvements—with clear milestones and measurable results.',
                },
              },
              {
                '@type': 'Question',
                name: 'How long do projects usually take?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'It depends on scope. Focused close acceleration or automation projects often run 4–12 weeks. Broader finance transformation or ongoing advisory support can last several months on a project or retainer basis.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do you work remotely or on-site?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'I am flexible. Most work today is done remotely using secure collaboration tools, but I can support on-site or hybrid arrangements when it adds the most value.',
                },
              },
              {
                '@type': 'Question',
                name: 'How do I get started?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Book a no-obligation 30-minute consultation directly on the contact page, or call me at (747) 370-9393. We’ll discuss your situation and determine the best path forward.',
                },
              },
            ],
          }),
        }}
      />

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