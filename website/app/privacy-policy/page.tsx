'use client';

import { useState } from 'react';

export default function PrivacyPolicy() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9]">
      
      {/* Navbar with Logo */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f2c]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-20">
          <a href="/" className="flex items-center gap-3 group">
            <img src="/mh-logo.png" alt="MH Logo" className="h-20 w-20 rounded-full object-contain" />
            <span className="font-semibold text-lg tracking-[-0.3px] group-hover:text-[#c5a46e] transition-colors">
              Michael Hart Consulting Group LLC
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="/about" className="hover:text-[#c5a46e] transition-colors">About</a>
            <a href="/" className="hover:text-[#c5a46e] transition-colors">Home</a>
            <a href="/#why" className="hover:text-[#c5a46e] transition-colors">Why Us</a>
            <a href="/#services" className="hover:text-[#c5a46e] transition-colors">Services</a>
            <a href="/contact" className="hover:text-[#c5a46e] transition-colors">Contact</a>
          </div>

          <a href="/contact" className="hidden md:block px-6 py-2.5 bg-[#c5a46e] hover:bg-[#d4b57e] text-black text-sm font-medium rounded-full transition-all">
            Book a Consultation
          </a>

          <div onClick={() => setIsOpen(!isOpen)} className="md:hidden p-5 -mr-5 text-white active:bg-white/10 rounded-xl transition-colors touch-manipulation cursor-pointer select-none" role="button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6h12v12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-[#0a0f2c] border-t border-white/10 py-4">
            <div className="max-w-5xl mx-auto px-6 flex flex-col gap-4 text-sm">
              <a href="/about" className="py-2 hover:text-[#c5a46e] transition-colors" onClick={() => setIsOpen(false)}>About</a>
              <a href="/" className="py-2 hover:text-[#c5a46e] transition-colors" onClick={() => setIsOpen(false)}>Home</a>
              <a href="/#why" className="py-2 hover:text-[#c5a46e] transition-colors" onClick={() => setIsOpen(false)}>Why Us</a>
              <a href="/#services" className="py-2 hover:text-[#c5a46e] transition-colors" onClick={() => setIsOpen(false)}>Services</a>
              <a href="/contact" className="py-2 hover:text-[#c5a46e] transition-colors" onClick={() => setIsOpen(false)}>Contact</a>
            </div>
          </div>
        )}
      </nav>

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
    </div>
  );
}