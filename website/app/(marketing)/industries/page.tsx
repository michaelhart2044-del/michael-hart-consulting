import Link from 'next/link';
import type { Metadata } from 'next';
import { site } from '@/lib/site';

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

const industries = [
  {
    name: 'Legal & Litigation',
    slug: 'legal-litigation',
    description: 'We provide forensic accounting and litigation support, damage calculations, and expert testimony for law firms and corporate legal teams. Our work includes fraud investigations, financial statement analysis, and discovery assistance grounded in GAAP/GAAS principles. We help legal professionals navigate complex disputes with clear, defensible deliverables.',
  },
  {
    name: 'Private Equity & Finance',
    slug: 'private-equity-finance',
    description: 'For PE firms and investors, we deliver M&A due diligence, quality of earnings analysis, valuation support, and post-close integration. We specialize in finance function transformation, SOX controls for portfolio companies, and automation of reporting processes to drive value creation and scalability.',
  },
  {
    name: 'Manufacturing',
    slug: 'manufacturing',
    description: 'Manufacturers benefit from our month-end close acceleration, fixed asset accounting, and process automation using SQL, Power Query, and ERP tools. We implement SOX controls, lease accounting (FAS 13), and variance analysis to improve accuracy, reduce cycle times, and support multi-location operations.',
  },
  {
    name: 'Technology & SaaS',
    slug: 'technology-saas',
    description: 'Tech and SaaS companies rely on us for revenue accounting under ASC 606, automated reconciliations, and financial forecasting. We build Power BI dashboards, streamline close processes, and support AI-assisted automation to help high-growth teams scale efficiently with strong controls.',
  },
  {
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Healthcare providers and systems use our expertise in multi-location month-end close, revenue accounting for fee-for-service models, and audit support. We automate billing reconciliations, implement internal controls, and deliver board-level reporting to enhance compliance and operational efficiency across facilities.',
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'Real estate firms and investors work with us on financial forecasting, capital structure planning, and process automation for property accounting and reporting. We provide SOX controls where applicable, lease classification analysis, and transformation support to professionalize finance operations.',
  },
  {
    name: 'Professional Services',
    slug: 'professional-services',
    description: 'Professional services firms (consulting, accounting, legal) partner with us for finance transformation, team leadership development, and automation of time-intensive processes. We implement controls, standardize reporting, and deliver practical recommendations that improve profitability and scalability.',
  },
  {
    name: 'Restaurant Industry',
    slug: 'restaurant-industry',
    description: 'Restaurant groups and chains benefit from our multi-location month-end close, revenue accounting for complex sales and tips, and automation of inventory, labor, and payroll processes. We implement controls for franchise compliance and provide clear operational reporting to support growth and profitability.',
  },
  {
    name: 'Hospitality',
    slug: 'hospitality',
    description: 'Hospitality businesses (hotels, resorts, and food service) use our expertise in property-level and portfolio-wide close processes, revenue management accounting, and automation of guest billing and expense tracking. We strengthen controls and deliver timely financial insights for operators managing multiple properties.',
  },
  {
    name: 'Online Retail Industry',
    slug: 'online-retail-industry',
    description: 'E-commerce and online retail companies rely on us for ASC 606 revenue recognition, order-to-cash automation, returns and refund accounting, and financial forecasting tied to marketing and fulfillment metrics. We help scale finance operations with strong controls as transaction volumes grow.',
  },
];

export default function Industries() {
  return (
    <>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-semibold tracking-tight">Industries We Serve</h1>
          <p className="mt-4 text-lg text-muted">
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
            href="/contact#book" 
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
