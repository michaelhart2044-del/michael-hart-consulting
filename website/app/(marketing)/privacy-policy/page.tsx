import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${site.name}. Learn how we collect, use, protect, and share your personal information when you use our website or contact us.`,
  openGraph: {
    title: `Privacy Policy | ${site.name}`,
    description: `Privacy Policy for ${site.name}. Learn how we collect, use, protect, and share your personal information when you use our website or contact us.`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Privacy Policy | ${site.name}`,
    description: `Privacy Policy for ${site.name}. Learn how we collect, use, protect, and share your personal information when you use our website or contact us.`,
  },
};

export default function PrivacyPolicy() {
  return (
    <>
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-12">
        <h1 className="text-5xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-[#94a3b8]">Last updated: June 2026</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-20 text-[#94a3b8] leading-relaxed space-y-10">
        
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, such as when you fill out our contact form, including your name, email address, and message content. We may also collect usage data through analytics tools to improve our website experience.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to respond to your inquiries, provide our consulting services, improve our website, and communicate with you about our services. We do not sell your personal information to third parties.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">3. Cookies and Analytics</h2>
          <p>We use cookies and similar tracking technologies (such as Google Analytics 4 (GA4) and Microsoft Clarity) to analyze website traffic and understand how visitors interact with our site. This helps us improve user experience. These tools are only activated after consent via the cookie banner.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing</h2>
          <p>We may share your information with trusted service providers who assist us in operating our website and conducting our business. We only share information as necessary and under strict confidentiality agreements.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
          <p>We implement reasonable security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data by contacting us directly. We will respond to your request in accordance with applicable laws.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          
          <div className="mt-2 text-[#f1f5f9]">
            {site.name}<br />
            Email: <a href={`mailto:${site.email}`} className="text-[#c5a46e] hover:underline">{site.email}</a><br />
            Phone: {site.phone}
          </div>
        </div>

      </div>

    </>
  );
}