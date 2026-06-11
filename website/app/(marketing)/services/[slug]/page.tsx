import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getServiceBySlug, getAllServiceSlugs, services } from '@/lib/services';
import { site } from '@/lib/site';

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return { title: 'Service Not Found' };
  }

  return {
    title: service.title,
    description: service.description,
    openGraph: {
      title: `${service.title} | Michael Hart Consulting Group`,
      description: service.description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.title} | Michael Hart Consulting Group`,
      description: service.description,
    },
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  // JSON-LD Structured Data - ProfessionalService + context for the business
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: service.title,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: site.name,
      telephone: site.phone,
      email: site.email,
      url: site.url,
    },
    areaServed: 'United States',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Consulting Services',
      itemListElement: services.map((s, index) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.title,
          description: s.shortDesc,
        },
        position: index + 1,
      })),
    },
  };

  return (
    <>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-12">
        <div className="max-w-3xl">
          <Link href="/services" className="text-sm text-accent hover:underline mb-4 inline-block">
            ← All Services
          </Link>
          <h1 className="text-5xl font-semibold tracking-tight">{service.title}</h1>
          <p className="mt-4 text-xl text-muted">{service.shortDesc}</p>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-12">
        {/* Introduction */}
        <div className="max-w-3xl">
          <p className="text-lg text-muted leading-relaxed">{service.longIntro}</p>
        </div>

        {/* What We Deliver */}
        <div className="bg-card border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-6">What We Deliver</h2>
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-muted">
            {service.deliverables.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-accent mt-1.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Who It's For */}
        <div className="bg-card border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Who It's For</h2>
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-muted">
            {service.whoFor.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-accent mt-1.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Our Approach */}
        <div className="bg-card border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Our Approach</h2>
          <ul className="space-y-3 text-muted">
            {service.approach.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-accent mt-1.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto text-center pt-8 border-t border-white/10">
          <p className="text-muted mb-6">
            Ready to explore how this service can address your specific situation?
          </p>
          <Link
            href="/contact#book"
            className="inline-block px-10 py-4 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-lg rounded-full transition-all active:scale-[0.985]"
          >
            Book a Consultation
          </Link>
          <p className="mt-4 text-sm text-subtle">
            Or call us directly at <a href={site.phoneHref} className="hover:text-accent">{site.phone}</a>
          </p>
        </div>
      </div>

    </>
  );
}
