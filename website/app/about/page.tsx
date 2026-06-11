'use client';

import { useState } from 'react';

export default function About() {
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
            <a href="/" className="hover:text-[#c5a46e] transition-colors">Home</a>
            <a href="/about" className="hover:text-[#c5a46e] transition-colors">About</a>
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
              <a href="/" className="py-2 hover:text-[#c5a46e] transition-colors" onClick={() => setIsOpen(false)}>Home</a>
              <a href="/about" className="py-2 hover:text-[#c5a46e] transition-colors" onClick={() => setIsOpen(false)}>About</a>
              <a href="/#why" className="py-2 hover:text-[#c5a46e] transition-colors" onClick={() => setIsOpen(false)}>Why Us</a>
              <a href="/#services" className="py-2 hover:text-[#c5a46e] transition-colors" onClick={() => setIsOpen(false)}>Services</a>
              <a href="/contact" className="py-2 hover:text-[#c5a46e] transition-colors" onClick={() => setIsOpen(false)}>Contact</a>
              <a href="/contact" className="mt-4 px-6 py-3 bg-[#c5a46e] hover:bg-[#d4b57e] text-black font-medium rounded-full text-center transition-all" onClick={() => setIsOpen(false)}>
                Book a Consultation
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Page Header */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-semibold tracking-[-1px] leading-tight">
            About Michael Hart Consulting Group LLC
          </h1>
          <p className="mt-4 text-lg text-[#94a3b8]">
            We help businesses and legal teams navigate complex financial challenges with clarity, precision, and strategic insight.
          </p>
        </div>
      </div>

      {/* Who We Are */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-[#0f172a]">
          <h2 className="text-3xl font-semibold mb-6">Who We Are</h2>
          <p className="text-lg text-[#94a3b8] leading-relaxed">
            Michael Hart Consulting Group LLC was founded with a clear mission: to deliver high-quality, practical advisory services that help organizations solve complex problems and make confident decisions.
          </p>
          <p className="mt-6 text-lg text-[#94a3b8] leading-relaxed">
            With deep expertise in forensic accounting, mergers and acquisitions, financial strategy, and AI-driven solutions, we bring both traditional financial discipline and modern technology to every engagement.
          </p>
        </div>
      </div>

      {/* Experience & Expertise */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-[#0f172a]">
          <h2 className="text-3xl font-semibold mb-6">Experience & Expertise</h2>
          <p className="text-lg text-[#94a3b8] leading-relaxed">
            Our work spans a wide range of complex matters, including litigation support, financial investigations, business restructuring, M&A due diligence, and strategic financial planning. 
            We have advised business owners, executives, legal teams, and investors across multiple industries.
          </p>
          <p className="mt-6 text-lg text-[#94a3b8] leading-relaxed">
            We combine decades of hands-on experience with modern tools — including data analytics and AI — to deliver faster, clearer, and more actionable results.
          </p>
        </div>
      </div>

      {/* Our Approach */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="max-w-3xl border border-white/10 rounded-2xl p-8 bg-[#0f172a]">
          <h2 className="text-3xl font-semibold mb-6">Our Approach</h2>
          <p className="text-lg text-[#94a3b8] leading-relaxed">
            We believe that great advisory work is built on three pillars: deep expertise, clear communication, and practical results. 
            We don’t just deliver reports — we partner with our clients to understand their goals and help them achieve measurable outcomes.
          </p>
          <p className="mt-6 text-lg text-[#94a3b8] leading-relaxed">
            Every engagement is approached with integrity, discretion, and a commitment to excellence.
          </p>
        </div>
      </div>

    </div>
  );
}