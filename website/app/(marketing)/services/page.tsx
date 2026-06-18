import Link from 'next/link';
import type { Metadata } from 'next';
import { services, flagshipServiceSlugs } from '@/lib/services';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Services',
  description: `Flagship services in operations, controls & automation plus specialized advisory from ${site.name}. ${site.description}`,
  openGraph: {
    title: `Services | ${site.name}`,
    description: `Specialized advisory services from ${site.name}. ${site.description}`,
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
    title: `Services | ${site.name}`,
    description: `Specialized advisory services from ${site.name}. ${site.description}`,
    images: [site.ogImage],
  },
};

export default function ServicesIndex() {
  return (
    <>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-semibold tracking-tight">Our Services</h1>
          <p className="mt-4 text-lg text-muted">
            Our flagship services focus on operations, controls, and automation — the core of our expertise. We specialize in month-end close and financial reporting, process automation and finance transformation, SOX controls and audit support, and finance function transformation and leadership. We also provide additional specialized support across a broader range of financial and operational challenges.
          </p>
        </div>
      </div>

      {/* Flagship Services */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-2xl mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Flagship Services</h2>
          <p className="mt-2 text-base md:text-lg text-muted">
            These four areas represent our primary focus and deepest expertise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services
            .filter((service) =>
              flagshipServiceSlugs.includes(service.slug as typeof flagshipServiceSlugs[number])
            )
            .map((service) => (
              <Link 
                key={service.slug} 
                href={`/services/${service.slug}`}
                className="group border border-white/10 rounded-2xl p-6 bg-card hover:border-accent/40 hover:bg-[#111827] transition-all duration-300 flex flex-col no-underline relative"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent/60 rounded-t-2xl" />
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

      {/* Additional Services */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="max-w-2xl mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Additional Services</h2>
          <p className="mt-2 text-base md:text-lg text-muted">
            We also deliver specialized advisory in forensic accounting, M&amp;A, forecasting, AI solutions, and more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services
            .filter((service) =>
              !flagshipServiceSlugs.includes(service.slug as typeof flagshipServiceSlugs[number])
            )
            .map((service) => (
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
            href="/prepare-analysis"
            className="inline-block px-8 py-3 bg-accent hover:bg-accent-hover text-black font-medium rounded-full transition-all active:scale-[0.985]"
          >
            Schedule a Consultation
          </Link>
        </div>
      </div>

    </>
  );
}
