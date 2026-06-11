import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${site.name}. Review the legal terms, conditions, and agreements governing the use of our consulting services and website.`,
  openGraph: {
    title: `Terms of Service | ${site.name}`,
    description: `Terms of Service for ${site.name}. Review the legal terms, conditions, and agreements governing the use of our consulting services and website.`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Terms of Service | ${site.name}`,
    description: `Terms of Service for ${site.name}. Review the legal terms, conditions, and agreements governing the use of our consulting services and website.`,
  },
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9]">
      <Navbar />

      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-12">
        <h1 className="text-5xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-[#94a3b8]">Last updated: June 2026</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-20 text-[#94a3b8] leading-relaxed space-y-10">
        
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using this website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">2. Services</h2>
          <p>Michael Hart Consulting Group LLC provides consulting services in forensic accounting, mergers & acquisitions, financial strategy, and AI-driven business solutions. All services are subject to separate engagement agreements.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
          <p>You agree to provide accurate information when contacting us and to use this website in a lawful manner. You are responsible for maintaining the confidentiality of any information you submit.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">4. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, Michael Hart Consulting Group LLC shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of this website.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
          <p>All content on this website, including text, graphics, and logos, is the property of Michael Hart Consulting Group LLC and is protected by applicable intellectual property laws.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">6. Governing Law</h2>
          <p>These Terms of Service shall be governed by and construed in accordance with the laws of the State of Georgia, United States.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting on this page.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us at:</p>
          <p className="mt-2">
            {site.name}<br />
            Email: <a href={`mailto:${site.email}`} className="text-[#c5a46e] hover:underline">{site.email}</a><br />
            Phone: {site.phone}
          </p>
        </div>

      </div>

      <Footer />
    </div>
  );
}