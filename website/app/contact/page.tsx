'use client';

import { useState } from 'react';
import { sendContactEmail } from '../actions';

export default function Contact() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError('');
    setIsSuccess(false);

    const result = await sendContactEmail(formData);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setError('Something went wrong. Please try again or email us directly.');
    }

    setIsSubmitting(false);
  }

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

          <a href="#form" className="hidden md:block px-6 py-2.5 bg-[#c5a46e] hover:bg-[#d4b57e] text-black text-sm font-medium rounded-full transition-all">
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
              <a href="#form" className="mt-4 px-6 py-3 bg-[#c5a46e] hover:bg-[#d4b57e] text-black font-medium rounded-full text-center transition-all" onClick={() => setIsOpen(false)}>
                Book a Consultation
              </a>
            </div>
          </div>
        )}
      </nav>

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
            
            {isSuccess ? (
              <div className="bg-green-900/30 border border-green-700 rounded-2xl p-8 text-center">
                <p className="text-green-400 text-lg font-medium">Thank you! Your message has been sent.</p>
                <p className="text-[#94a3b8] mt-2">We'll get back to you within 24 hours on business days.</p>
              </div>
            ) : (
              <form action={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-2">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#94a3b8] mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#94a3b8] mb-2">Message</label>
                  <textarea 
                    name="message"
                    required
                    rows={6}
                    className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
                    placeholder="Tell us about your situation or how we can help..."
                  ></textarea>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-10 py-4 bg-[#c5a46e] hover:bg-[#d4b57e] text-black font-medium rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div className="md:col-span-2">
            <div className="border border-white/10 rounded-2xl p-8 bg-[#0f172a] h-full">
              <h2 className="text-2xl font-semibold mb-8">Contact Information</h2>
              
              <div className="space-y-8 text-[#94a3b8]">
                <div>
                  <div className="text-sm text-[#c5a46e] font-medium tracking-widest mb-2">PHONE</div>
                  <a href="tel:7473709393" className="text-xl hover:text-[#c5a46e] transition-colors">(747) 370-9393</a>
                </div>

                <div>
                  <div className="text-sm text-[#c5a46e] font-medium tracking-widest mb-2">EMAIL</div>
                  <a href="mailto:michael@michaelhartconsulting.com" className="text-xl hover:text-[#c5a46e] transition-colors">
                    michael@michaelhartconsulting.com
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

    </div>
  );
}