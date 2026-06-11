import Link from 'next/link';
import { site } from '@/lib/site';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0f2c] border-t border-white/10 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-y-10">
          {/* Left side */}
          <div>
            <div className="font-semibold text-lg">{site.name}</div>
            <p className="mt-2 text-sm text-[#64748b] max-w-xs">
              {site.tagline}
            </p>
          </div>

          {/* Right side */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-8 text-sm">
            <div>
              <div className="font-medium text-[#c5a46e] mb-3">Company</div>
              <div className="space-y-2 text-[#94a3b8]">
                <Link href="/about" className="hover:text-[#c5a46e] transition-colors">
                  About
                </Link>
                <div>
                  <Link href="/services" className="hover:text-[#c5a46e] transition-colors">
                    Services
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium text-[#c5a46e] mb-3">Legal</div>
              <div className="space-y-2 text-[#94a3b8]">
                <Link href="/privacy-policy" className="hover:text-[#c5a46e] transition-colors">
                  Privacy Policy
                </Link>
                <div>
                  <Link href="/terms-of-service" className="hover:text-[#c5a46e] transition-colors">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium text-[#c5a46e] mb-3">Contact</div>
              <div className="space-y-2 text-[#94a3b8]">
                <div>{site.phone}</div>
                <a
                  href={site.email ? `mailto:${site.email}` : undefined}
                  className="hover:text-[#c5a46e] transition-colors"
                >
                  {site.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-xs text-[#64748b] flex flex-col md:flex-row justify-between gap-y-2">
          <div>© {year} {site.name}. All rights reserved.</div>
          <div className="space-x-1">
            <Link href="/privacy-policy" className="hover:text-[#c5a46e] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms-of-service" className="hover:text-[#c5a46e] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
