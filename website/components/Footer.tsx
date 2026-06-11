import Link from 'next/link';
import { site } from '@/lib/site';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-white/10 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-y-10">
          {/* Left side */}
          <div>
            <div className="font-semibold text-base whitespace-nowrap">{site.name}</div>
            <p className="mt-2 text-sm text-subtle max-w-xs">
              {site.tagline}
            </p>
          </div>

          {/* Right side */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-16 gap-y-8 text-sm">
            <div>
              <div className="font-medium text-accent mb-3">Company</div>
              <div className="space-y-2 text-muted">
                <Link href="/about" className="hover:text-accent transition-colors">
                  About
                </Link>
                <div>
                  <Link href="/services" className="hover:text-accent transition-colors">
                    Services
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium text-accent mb-3">Legal</div>
              <div className="space-y-2 text-muted">
                <Link href="/privacy-policy" className="hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
                <div>
                  <Link href="/terms-of-service" className="hover:text-accent transition-colors">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium text-accent mb-3">Contact</div>
              <div className="text-muted text-sm space-y-1">
                <a
                  href={site.phoneHref}
                  className="hover:text-accent transition-colors block"
                >
                  {site.phone}
                </a>
                <a
                  href={site.email ? `mailto:${site.email}` : undefined}
                  className="hover:text-accent transition-colors block"
                >
                  {site.email}
                </a>
              </div>
            </div>

            <div>
              <div className="font-medium text-accent mb-3">Social</div>
              <div className="flex gap-4 text-muted">
                {site.social?.linkedin && (
                  <a
                    href={site.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors"
                    aria-label="LinkedIn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                )}
                {site.social?.x && (
                  <a
                    href={site.social.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors"
                    aria-label="X (Twitter)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25l-7.451 8.52L4.5 2.25H1.25l8.52 10.68L1.25 21.75h3.75l7.451-8.52 6.793 8.52h3.75l-8.52-10.68 8.52-10.68h-3.75z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-xs text-subtle flex flex-col md:flex-row justify-between gap-y-2">
          <div>© {year} <span className="whitespace-nowrap">{site.name}</span>. All rights reserved.</div>
          <div className="space-x-1">
            <Link href="/privacy-policy" className="hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms-of-service" className="hover:text-accent transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
