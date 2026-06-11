import Link from 'next/link';
import type { Metadata } from 'next';
import { services } from '@/lib/services';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Specialized advisory services including forensic accounting & litigation support, M&A advisory, revenue accounting & compliance, month-end close & reporting, SOX controls & audit support, process automation, AI-assisted software development, finance function transformation, financial forecasting, and AI & automation solutions.',
  openGraph: {
    title: 'Services | Michael Hart Consulting Group',
    description: 'Specialized advisory services including forensic accounting & litigation support, M&A advisory, revenue accounting & compliance, month-end close & reporting, SOX controls & audit support, process automation, AI-assisted software development, finance function transformation, financial forecasting, and AI & automation solutions.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Services | Michael Hart Consulting Group',
    description: 'Specialized advisory services including forensic accounting & litigation support, M&A advisory, revenue accounting & compliance, month-end close & reporting, SOX controls & audit support, process automation, AI-assisted software development, finance function transformation, financial forecasting, and AI & automation solutions.',
  },
};

export default function ServicesIndex() {
  return (
    <>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-semibold tracking-tight">Our Services</h1>
          <p className="mt-4 text-lg text-muted">
            We deliver specialized advisory across revenue accounting, month-end close, SOX controls, process automation, AI-assisted software development, finance function transformation, financial forecasting, and AI-driven solutions. Engagements are tailored to your operations, leveraging tools like SQL, Power Query, Power BI, and ERP systems for measurable efficiency and accuracy.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group border border-white/10 rounded-2xl p-6 bg-card hover:border-accent/40 hover:bg-[#111827] transition-all duration-300 flex flex-col no-underline"
            >
              <h3 className="text-xl font-semibold mb-3 group-hover:text-accent transition-colors">
                {service.title}
              </h3>
              <p className="text-muted flex-grow mb-4">
                {service.shortDesc}
              </p>
              <div className="text-accent text-sm font-medium group-hover:underline">
                Learn more →
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted mb-4">
            Not sure which service fits your situation?
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-accent hover:bg-accent-hover text-black font-medium rounded-full transition-all active:scale-[0.985]"
          >
            Schedule a Consultation
          </Link>
        </div>
      </div>

    </>
  );
}
