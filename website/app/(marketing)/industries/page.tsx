import Link from 'next/link';
import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { industries } from '@/lib/industries';

export const metadata: Metadata = {
  title: 'Industries',
  description: `Industry-specific financial advisory services from ${site.name}. Tailored expertise in operations, controls, automation, and transformation for healthcare, technology, manufacturing, and more.`,
  openGraph: {
    title: `Industries | ${site.name}`,
    description: `Industry-specific financial advisory services from ${site.name}. Tailored expertise in operations, controls, automation, and transformation.`,
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
    title: `Industries | ${site.name}`,
    description: `Industry-specific financial advisory services from ${site.name}. Tailored expertise in operations, controls, automation, and transformation.`,
    images: [site.ogImage],
  },
};

export default function Industries() {
  return (
    <>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="max-w-3xl">
          <h1 className="type-h1">Industries We Serve</h1>
          <p className="mt-4 type-lead">
            We tailor our flagship services in operations, controls, automation, and finance transformation to the unique challenges of each industry. Engagements are designed around the specific regulatory, operational, and growth needs of our clients.
          </p>
        </div>
      </div>

      {/* Industries */}
      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-12">
        {industries.map((industry) => (
          <div key={industry.slug} id={industry.slug} className="scroll-mt-20">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight mb-4">{industry.name}</h2>
              <p className="text-lg text-muted leading-relaxed">
                {industry.description}
              </p>
              <div className="mt-4">
                <Link 
                  href="/services" 
                  className="text-accent hover:underline font-medium text-sm"
                >
                  Explore our services →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="border-t border-white/10 bg-section py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">Ready to discuss your industry-specific challenges?</h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            Book a no-obligation consultation to explore how we can support your organization.
          </p>
          <Link 
            href="/prepare-analysis" 
            className="inline-block px-10 py-4 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-lg rounded-full transition-all active:scale-[0.985]"
          >
            Book a Consultation
          </Link>
          <p className="mt-6 text-sm text-subtle">
            Or call us directly at <span className="text-muted font-medium">(747) 370-9393</span>
          </p>
        </div>
      </div>
    </>
  );
}
