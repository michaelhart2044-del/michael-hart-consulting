import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Michael Hart Consulting Group. Reach out for forensic accounting, M&A advisory, financial strategy, or AI-powered business solutions. Book a consultation or send us a message.',
  openGraph: {
    title: 'Contact | Michael Hart Consulting Group',
    description: 'Get in touch with Michael Hart Consulting Group. Reach out for forensic accounting, M&A advisory, financial strategy, or AI-powered business solutions. Book a consultation or send us a message.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | Michael Hart Consulting Group',
    description: 'Get in touch with Michael Hart Consulting Group. Reach out for forensic accounting, M&A advisory, financial strategy, or AI-powered business solutions. Book a consultation or send us a message.',
  },
};

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9]">
      <Navbar ctaHref="#form" />

      {/* Contact Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-semibold tracking-tight">Get in Touch</h1>
          <p className="mt-4 text-lg text-[#94a3b8]">
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
            <div className="border border-white/10 rounded-2xl p-8 bg-[#0f172a] h-full">
              <h2 className="text-2xl font-semibold mb-8">Contact Information</h2>
              
              <div className="space-y-8 text-[#94a3b8]">
                <div>
                  <div className="text-sm text-[#c5a46e] font-medium tracking-widest mb-2">PHONE</div>
                  <a href={site.phoneHref} className="text-xl hover:text-[#c5a46e] transition-colors">{site.phone}</a>
                </div>

                <div>
                  <div className="text-sm text-[#c5a46e] font-medium tracking-widest mb-2">EMAIL</div>
                  <a href={`mailto:${site.email}`} className="text-xl hover:text-[#c5a46e] transition-colors">
                    {site.email}
                  </a>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/10 text-sm text-[#64748b] leading-relaxed">
                We typically respond within 24 hours on business days.
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}