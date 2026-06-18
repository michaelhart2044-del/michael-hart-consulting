import Link from 'next/link';
import type { Metadata } from 'next';
import { site } from '@/lib/site';
import Image from 'next/image';
import { industries } from '@/lib/industries';

export const metadata: Metadata = {
  title: 'About',
  description: `Learn about ${site.name}. ${site.description}`,
  openGraph: {
    title: `About | ${site.name}`,
    description: `Learn about ${site.name}. ${site.description}`,
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
    title: `About | ${site.name}`,
    description: `Learn about ${site.name}. ${site.description}`,
    images: [site.ogImage],
  },
};

export default function About() {
  return (
    <>
      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-1px] leading-tight">
            About <span className="whitespace-nowrap">{site.name}</span>
          </h1>
          <p className="mt-4 text-lg text-muted">
            Expert financial advisory in operations, controls, automation, revenue accounting, financial close, and transformation. Helping organizations achieve efficiency, compliance, and strategic growth.
          </p>
        </div>
      </div>

      {/* Founder */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-card">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 border border-white/10 overflow-hidden">
              <Image 
                src="/mh-logo.png" 
                alt="Michael Hart Consulting" 
                width={80} 
                height={80} 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="flex-1">
              <div>
                <div className="font-semibold text-2xl">Michael Hart</div>
                <div className="text-accent text-sm tracking-[2px] mt-0.5">FOUNDER &amp; PRINCIPAL</div>
              </div>
              <p className="mt-4 text-muted leading-relaxed">
                Michael Hart is a results-driven accounting professional with deep experience across public, private, and PE-backed organizations. He specializes in transforming manual processes into automated, scalable workflows and building teams that deliver stronger controls and faster reporting.
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
            Founded with a clear mission: deliver high-quality, practical advisory that helps organizations solve complex problems and make confident decisions. We bring deep expertise in operations, controls, automation, revenue accounting, and finance transformation — combining traditional discipline with modern tools.
          </p>
        </div>
      </div>

      {/* Experience & Expertise */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-card">
          <h2 className="text-3xl font-semibold mb-6">Experience &amp; Expertise</h2>
          
          <p className="text-lg text-muted leading-relaxed mb-6">
            With experience across public, private, and PE-backed organizations, Michael specializes in financial reporting, revenue accounting, reconciliations, audit support, and process optimization — grounded in operations, controls, automation, and transformation.
          </p>

          <div className="space-y-4 text-muted">
            <div>
              <div className="font-medium text-foreground mb-1">Revenue Accounting &amp; Month-End Close</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Manage revenue accounting activities including journal entries, fee-for-service postings, and monthly revenue analysis</li>
                <li>Prepare and review monthly reconciliations, investigate discrepancies, and support month-end close processes</li>
                <li>Partner cross-functionally to validate revenue streams and deliver ad-hoc reporting on trends and variances</li>
              </ul>
            </div>

            <div>
              <div className="font-medium text-foreground mb-1">Process Improvement &amp; Automation</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Design automated workflows using SQL, Power Query, and ERP tools to transform manual processes</li>
                <li>Reduced reconciliation time significantly through SQL-powered automation and Power Query data refreshes</li>
                <li>Lead Six Sigma Black Belt projects focused on automating cash reconciliation for enhanced accuracy and efficiency</li>
              </ul>
            </div>

            <div>
              <div className="font-medium text-foreground mb-1">Controls, Audit Support &amp; Team Leadership</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Collaborate with auditors to resolve inquiries and strengthen SOX controls and internal processes</li>
                <li>Reconcile fixed assets, GL activity, leasing classifications (FAS 13), and perform ASC 606 revenue reporting</li>
                <li>Led and developed accounting teams, implementing policies, controls, and procedures across multi-location operations</li>
              </ul>
            </div>
          </div>

          {/* Industries Served - trust signal */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-xs tracking-[2px] text-accent mb-3">INDUSTRIES SERVED</div>
            <div className="flex flex-wrap gap-2">
              {industries.map(({ name, slug }) => (
                <Link
                  key={slug}
                  href={`/industries#${slug}`}
                  className="inline-block px-3 py-1 text-xs border border-white/10 rounded-full text-muted hover:border-accent/40 hover:text-accent transition-colors"
                >
                  {name}
                </Link>
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
              <div className="font-medium text-foreground mb-2">Education</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Bachelor of Science in Accountancy &amp; Business Administration (Finance &amp; Real Estate), California State University, Northridge</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-foreground mb-2">Professional Development</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Six Sigma Green Belt, Optum</li>
                <li>Six Sigma Black Belt certification (in progress)</li>
                <li>Advanced training in process optimization, automation, and ERP systems</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 grid md:grid-cols-2 gap-x-8 gap-y-6 text-muted">
            <div>
              <div className="font-medium text-foreground mb-2">Core Competencies</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Month-End &amp; Year-End Close</li>
                <li>Financial Reporting &amp; Analysis</li>
                <li>Revenue Accounting (ASC 606)</li>
                <li>SOX Controls &amp; Audit Support</li>
                <li>Process Improvement &amp; Automation</li>
                <li>Team Leadership &amp; Staff Development</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-foreground mb-2">Technical Skills</div>
              <div className="text-sm space-y-2">
                <div><strong>ERP &amp; Finance:</strong> SL-Dynamics, PeopleSoft, SAP, Oracle EBS, Hyperion, Blackline, Planful</div>
                <div><strong>Tools:</strong> Power BI, Power Query, SQL, Salesforce, Microsoft Office (Advanced Excel)</div>
                <div><strong>Other:</strong> Fixed asset systems, process automation workflows</div>
              </div>
            </div>
          </div>
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
              Whether you&apos;re preparing for litigation, evaluating a transaction, or modernizing financial processes, we&apos;re here to help.
            </p>
            <div className="mt-8">
              <Link
                href="/prepare-analysis"
                className="inline-block px-10 py-4 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium text-lg rounded-full transition-all active:scale-[0.985]"
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