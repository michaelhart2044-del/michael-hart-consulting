import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import { site } from '@/lib/site';
import Script from 'next/script';
import CalendlyWidget from '@/components/CalendlyWidget';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with ${site.name}. ${site.description} Book a consultation or send us a message.`,
  openGraph: {
    title: `Contact | ${site.name}`,
    description: `Get in touch with ${site.name}. ${site.description} Book a consultation or send us a message.`,
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
    title: `Contact | ${site.name}`,
    description: `Get in touch with ${site.name}. ${site.description} Book a consultation or send us a message.`,
    images: [site.ogImage],
  },
};

export default function Contact() {
  return (
    <>
      {/* Contact Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-semibold tracking-tight">Get in Touch</h1>
          <p className="mt-4 text-lg text-muted">
            Whether you have a specific question or want to explore how we can support your business, we’d love to hear from you.
          </p>
        </div>
      </div>

      {/* Contact Form + Info */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-5 gap-12">
          
          {/* Contact Form */}
          <div className="md:col-span-3" id="form">
            <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
            <ContactForm />
          </div>

          {/* Contact Information */}
          <div className="md:col-span-2">
            <div className="border border-white/10 rounded-2xl p-8 bg-section h-full">
              <h2 className="text-2xl font-semibold mb-8">Contact Information</h2>
              
              <div className="space-y-8 text-muted">
                <div>
                  <div className="text-sm text-accent font-medium tracking-widest mb-2">PHONE</div>
                  <a href={site.phoneHref} className="text-lg hover:text-accent transition-colors">{site.phone}</a>
                </div>

                <div>
                  <div className="text-sm text-accent font-medium tracking-widest mb-2">EMAIL</div>
                  <a href={`mailto:${site.email}`} className="text-lg hover:text-accent transition-colors">
                    {site.email}
                  </a>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/10 text-sm text-subtle leading-relaxed">
                We typically respond within 24 hours on business days.
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 text-xs text-subtle">
                <div className="font-medium text-accent mb-1.5 tracking-widest">KEY OUTCOMES</div>
                <ul className="space-y-1">
                  <li>• Close cycles cut 80% (25 days → 5)</li>
                  <li>• Reconciliations 95% faster (6 hrs → 15 min)</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Recent Client Results - proof right before booking CTA */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">Recent client results</h2>
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
              quote: "Developed and led accounting teams, implementing standardized controls and procedures that supported scalable operations across multiple locations.",
              attribution: "Controller, Private Equity-Backed Manufacturing Company"
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

      {/* Calendly Booking Section */}
      <div id="book" className="max-w-5xl mx-auto px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">Book a Consultation Directly</h2>
          <p className="text-muted mb-8">
            Choose a time that works for you. We’ll send a calendar invite and confirmation.
          </p>
        </div>
        <CalendlyWidget />
      </div>

      <Script
        type="text/javascript"
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
      />

    </>
  );
}