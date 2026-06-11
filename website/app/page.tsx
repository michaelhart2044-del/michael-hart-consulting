'use client';

import { useState } from 'react';

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9]">
      
      {/* Navbar with Logo */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f2c]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-20">
          
          {/* Logo + Company Name */}
          <a href="/" className="flex items-center gap-3 group">
            <img 
              src="/mh-logo.png" 
              alt="MH Logo" 
              className="h-20 w-20 rounded-full object-contain"
            />
            <span className="font-semibold text-lg tracking-[-0.3px] group-hover:text-[#c5a46e] transition-colors">
              Michael Hart Consulting Group LLC
            </span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="/about" className="hover:text-[#c5a46e] transition-colors">About</a>
            <a href="/#why" className="hover:text-[#c5a46e] transition-colors">Why Us</a>
            <a href="/#services" className="hover:text-[#c5a46e] transition-colors">Services</a>
            <a href="/contact" className="hover:text-[#c5a46e] transition-colors">Contact</a>
          </div>

          {/* Desktop CTA Button */}
          <a 
            href="/contact" 
            className="hidden md:block px-6 py-2.5 bg-[#c5a46e] hover:bg-[#d4b57e] text-black text-sm font-medium rounded-full transition-all"
          >
            Book a Consultation
          </a>

          {/* Hamburger - iOS Friendly */}
          <div 
            onClick={() => setIsOpen(!isOpen)}
            onTouchEnd={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
            className="md:hidden p-5 -mr-5 text-white active:bg-white/10 rounded-xl transition-colors touch-manipulation cursor-pointer select-none"
            role="button"
            aria-label="Toggle navigation menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6h12v12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-[#0a0f2c] border-t border-white/10 py-4">
            <div className="max-w-5xl mx-auto px-6 flex flex-col gap-4 text-sm">
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

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-3xl">
          <h1 className="text-[2.45rem] leading-[1.1] md:text-5xl lg:text-6xl font-semibold tracking-[-1.5px]">
            Expert Advisory in Forensic Accounting,<br className="hidden md:block" />M&A, and AI-Powered Business Solutions
          </h1>

          <div className="mt-6 flex justify-center">
            <div className="h-[3px] w-[min(94%,680px)] bg-[#c5a46e]"></div>
          </div>

          <p className="mt-8 text-[15.5px] md:text-lg text-[#94a3b8] leading-relaxed max-w-2xl">
            Combining deep forensic expertise with strategic advisory and intelligent automation to deliver clear, actionable results.
          </p>

          <div className="mt-10 md:mt-12">
            <a 
              href="/contact" 
              className="inline-block w-full md:w-auto text-center px-8 py-4 bg-[#c5a46e] hover:bg-[#d4b57e] text-black font-medium text-base md:text-lg rounded-full transition-all active:scale-[0.985]"
            >
              Book a Consultation
            </a>
          </div>
        </div>
      </div>

      {/* Why Work With Us */}
      <section id="why" className="border-t border-white/10 bg-[#0f172a] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Why Work With Us</h2>
            <p className="mt-4 text-base md:text-lg text-[#94a3b8]">
              We combine deep financial expertise with modern technology to help businesses and legal teams navigate complex challenges with clarity and confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "🎯", title: "Proven in Complex Matters", desc: "Deep experience in forensic accounting, litigation support, mergers & acquisitions, and high-stakes financial advisory." },
              { icon: "⚡", title: "Expertise + Technology", desc: "We blend traditional financial expertise with AI and automation to deliver faster, clearer, and more actionable insights." },
              { icon: "✅", title: "Clear and Actionable Outcomes", desc: "We don’t just analyze — we help you make confident decisions with practical recommendations and measurable results." }
            ].map((item, i) => (
              <div 
                key={i} 
                className="group border border-white/10 rounded-2xl p-6 bg-[#0a0f2c] hover:border-[#c5a46e]/40 hover:bg-[#111827] transition-all duration-300 flex flex-col"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-[#c5a46e] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[#94a3b8] flex-grow">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section id="services" className="border-t border-white/10 bg-[#0a0f2c] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Our Services</h2>
            <p className="mt-4 text-base md:text-lg text-[#94a3b8]">
              We provide specialized advisory across complex financial, strategic, and operational challenges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "⚖️", title: "Forensic Accounting & Litigation Support", desc: "Expert analysis and support for disputes, investigations, and legal proceedings." },
              { icon: "🏢", title: "Business Setup & Structuring", desc: "Strategic guidance on company formation, ownership structures, and operational frameworks." },
              { icon: "🤝", title: "Mergers & Acquisitions Advisory", desc: "End-to-end support for buying, selling, and integrating businesses with financial and strategic precision." },
              { icon: "📈", title: "Financial Forecasting & Strategy", desc: "Data-driven forecasting, scenario planning, and long-term financial strategy development." },
              { icon: "🤖", title: "AI & Automation Solutions", desc: "Implementing intelligent systems that improve decision-making, efficiency, and financial processes." },
              { icon: "💻", title: "Website Design & Development", desc: "Modern, professional websites and web applications tailored to your brand and business goals." }
            ].map((service, i) => (
              <div 
                key={i} 
                className="group border border-white/10 rounded-2xl p-6 bg-[#0f172a] hover:border-[#c5a46e]/40 hover:bg-[#111827] transition-all duration-300 flex flex-col"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-[#c5a46e] transition-colors">
                  {service.title}
                </h3>
                <p className="text-[#94a3b8] flex-grow">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="border-t border-white/10 bg-[#0f172a] py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-[#0a0f2c] border border-white/10 rounded-2xl p-10 md:p-12 text-center hover:border-[#c5a46e]/30 transition-all duration-300">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to Get Started?</h2>
            <p className="mt-4 text-base md:text-lg text-[#94a3b8] max-w-xl mx-auto">
              Whether you're facing a complex challenge or planning your next strategic move, we’re here to help you move forward with clarity.
            </p>

            <div className="mt-10">
              <a 
                href="/contact" 
                className="inline-block px-10 py-4 bg-[#c5a46e] hover:bg-[#d4b57e] text-black font-medium text-lg rounded-full transition-all active:scale-[0.985]"
              >
                Book a Consultation
              </a>
            </div>

            <p className="mt-8 text-sm text-[#64748b]">
              Or call us directly at <span className="text-[#94a3b8] font-medium">(747) 370-9393</span>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0f2c] border-t border-white/10 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-y-10">
            {/* Left side */}
            <div>
              <div className="font-semibold text-lg">Michael Hart Consulting Group LLC</div>
              <p className="mt-2 text-sm text-[#64748b] max-w-xs">
                Strategic advisory for complex financial and business challenges.
              </p>
            </div>

            {/* Right side */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-8 text-sm">
              <div>
                <div className="font-medium text-[#c5a46e] mb-3">Company</div>
                <div className="space-y-2 text-[#94a3b8]">
                  <a href="/about" className="hover:text-[#c5a46e] transition-colors">About</a>
                  <div><a href="/#services" className="hover:text-[#c5a46e] transition-colors">Services</a></div>
                </div>
              </div>

              <div>
                <div className="font-medium text-[#c5a46e] mb-3">Legal</div>
                <div className="space-y-2 text-[#94a3b8]">
                  <a href="/privacy-policy" className="hover:text-[#c5a46e] transition-colors">Privacy Policy</a>
                  <div><a href="/terms-of-service" className="hover:text-[#c5a46e] transition-colors">Terms of Service</a></div>
                </div>
              </div>

              <div>
                <div className="font-medium text-[#c5a46e] mb-3">Contact</div>
                <div className="space-y-2 text-[#94a3b8]">
                  <div>(747) 370-9393</div>
                  <a href="mailto:michael@michaelhartconsulting.com" className="hover:text-[#c5a46e] transition-colors">
                    michael@michaelhartconsulting.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-xs text-[#64748b] flex flex-col md:flex-row justify-between gap-y-2">
            <div>© {new Date().getFullYear()} Michael Hart Consulting Group LLC. All rights reserved.</div>
            <div>Privacy Policy • Terms of Service</div>
          </div>
        </div>
      </footer>
    </div>
  );
}