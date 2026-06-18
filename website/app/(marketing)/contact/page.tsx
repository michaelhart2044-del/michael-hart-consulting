import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with ${site.name}. Book a consultation or send us a message. ${site.description}`,
  openGraph: {
    title: `Contact | ${site.name}`,
    description: `Get in touch with ${site.name}. Book a consultation or send us a message.`,
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
    description: `Get in touch with ${site.name}. Book a consultation or send us a message.`,
    images: [site.ogImage],
  },
};

export default function Contact() {
  return (
    <>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-12">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-semibold tracking-tight">Get in Touch</h1>
          <p className="mt-4 text-lg text-muted">
            Ready to explore how we can help? Start with a consultation. Have a general question instead? Send us a message below.
          </p>
        </div>
      </div>

      {/* Primary: Book Consultation */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-5 gap-12 items-start">
          <div className="md:col-span-3">
            <div className="bg-card border border-accent/30 rounded-2xl p-8 md:p-10 hover:border-accent/50 transition-all duration-300">
              <div className="text-xs tracking-widest text-accent font-medium mb-3">GET STARTED</div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Ready to work together?</h2>
              <p className="mt-4 text-muted leading-relaxed">
                Book a 30-minute initial consultation. Share a few details about your situation, then pick a time that works for you. Takes about 3 minutes.
              </p>
              <div className="mt-8">
                <Link
                  href="/prepare-analysis"
                  className="inline-block w-full md:w-auto text-center px-6 py-3 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium rounded-full transition-all active:scale-[0.985]"
                >
                  Book Consultation
                </Link>
              </div>
              <p className="mt-6 text-sm text-subtle">
                See client results on our{' '}
                <Link href="/#results" className="text-accent hover:underline">
                  homepage
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="md:col-span-2">
            <div className="border border-white/10 rounded-2xl p-8 bg-section h-full">
              <h2 className="text-2xl font-semibold mb-8">Contact Information</h2>

              <div className="space-y-8 text-muted">
                <div>
                  <div className="text-sm text-accent font-medium tracking-widest mb-2">PHONE</div>
                  <a href={site.phoneHref} className="text-lg hover:text-accent transition-colors">
                    {site.phone}
                  </a>
                </div>

                <div>
                  <div className="text-sm text-accent font-medium tracking-widest mb-2">EMAIL</div>
                  <a href={`mailto:${site.email}`} className="text-lg hover:text-accent transition-colors break-all">
                    {site.email}
                  </a>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/10 text-sm text-subtle leading-relaxed">
                We typically respond within 24 hours on business days.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary: General inquiry form */}
      <div className="border-t border-white/10 bg-section">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="max-w-2xl" id="form">
            <h2 className="text-2xl font-semibold mb-2">Have a general question?</h2>
            <p className="text-muted mb-8">
              Not ready to book yet? Send a message and we&apos;ll get back to you.
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  );
}
