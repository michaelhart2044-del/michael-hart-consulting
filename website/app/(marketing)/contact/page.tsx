import type { Metadata } from 'next';
import Link from 'next/link';
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
            <div className="mb-6 p-4 bg-card border border-accent/20 rounded-lg text-sm">
              <div className="text-xs tracking-widest text-accent font-medium mb-1">FEATURED CASE STUDY</div>
              <div className="font-medium mb-1">Month-End Close Acceleration</div>
              <div className="text-muted mb-1">Challenge: 25-day close cycle draining team at 8-facility healthcare provider.</div>
              <div className="text-muted mb-1">Approach: Standardized processes and automated reconciliations/close workflows.</div>
              <div className="text-muted">Results: Reduced to 5 business days, saving 160+ team hours per month.</div>
              <div className="text-xs text-subtle mt-1">— Controller, Multi-Location Healthcare Provider</div>
            </div>
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

      {/* Calendly Booking Section */}
      <div id="book" className="max-w-5xl mx-auto px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">Book a Consultation Directly</h2>
          <p className="text-muted mb-4">
            Optionally share a few details in advance on the prep page so we can make the most of our time:
          </p>
          <Link href="/prepare-analysis" className="inline-block text-accent hover:underline font-medium mb-6">
            Go to prep page →
          </Link>
          <p className="text-muted mb-8">
            Or book now. We’ll send a calendar invite and confirmation.
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