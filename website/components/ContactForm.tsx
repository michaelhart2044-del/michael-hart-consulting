'use client';

import { useState } from 'react';
import { sendContactEmail } from '../app/actions';

export default function ContactForm() {
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

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-green-900/30 border border-green-700 rounded-2xl p-8 text-center"
      >
        <p className="text-green-400 text-lg font-medium">Thank you! Your message has been sent.</p>
        <p className="text-[#94a3b8] mt-2">We've sent a confirmation to your email. We'll get back to you within 24 hours on business days. Please check your inbox (and spam folder).</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm text-[#94a3b8] mb-2">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          name="name"
          required
          aria-required="true"
          aria-describedby={error ? 'form-error' : undefined}
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm text-[#94a3b8] mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          aria-required="true"
          aria-describedby={error ? 'form-error' : undefined}
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm text-[#94a3b8] mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          aria-required="true"
          aria-describedby={error ? 'form-error' : undefined}
          rows={6}
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
          placeholder="Tell us about your situation or how we can help..."
        ></textarea>
      </div>

      {error && (
        <p id="form-error" role="alert" aria-live="assertive" className="text-red-400 text-sm">
          {error}
        </p>
      )}

      {/* Honeypot field for spam protection - hidden from users */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <label htmlFor="company_website">Company Website</label>
        <input
          id="company_website"
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="w-full md:w-auto px-10 py-4 bg-[#c5a46e] hover:bg-[#d4b57e] text-black font-medium rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
