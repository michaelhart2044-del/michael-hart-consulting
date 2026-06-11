import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Michael Hart Consulting Group LLC. Learn how we collect, use, protect, and share your personal information when you use our website or contact us.',
  openGraph: {
    title: 'Privacy Policy | Michael Hart Consulting Group',
    description: 'Privacy Policy for Michael Hart Consulting Group LLC. Learn how we collect, use, protect, and share your personal information when you use our website or contact us.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Michael Hart Consulting Group',
    description: 'Privacy Policy for Michael Hart Consulting Group LLC. Learn how we collect, use, protect, and share your personal information when you use our website or contact us.',
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9]">
      <Navbar />

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
          <p>We use cookies and similar tracking technologies (such as Microsoft Clarity and Vercel Analytics) to analyze website traffic and understand how visitors interact with our site. This helps us improve user experience.</p>
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
            Michael Hart Consulting Group LLC<br />
            Email: <a href="mailto:michael@michaelhartconsulting.com" className="text-[#c5a46e] hover:underline">michael@michaelhartconsulting.com</a><br />
            Phone: (747) 370-9393
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}