'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { site } from '@/lib/site';

interface NavbarProps {
  /** Optional override for the CTA button href (e.g. "#form" on the contact page) */
  ctaHref?: string;
  /** Optional active section for homepage anchor highlighting (e.g. "why" or "services") */
  activeSection?: 'why' | 'services';
}

interface NavItem {
  label: string;
  href: string;
}

const allNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Why Us', href: '/#why' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar({ ctaHref, activeSection }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === '/';

  // Auto-override CTA on contact page so shared (marketing) layout works without per-page props
  const resolvedCtaHref = ctaHref ?? (pathname === '/contact' ? '#form' : '/contact');

  // Desktop: omit Home link when on the homepage (logo serves as home)
  const desktopItems = isHome
    ? allNavItems.filter((item) => item.href !== '/')
    : allNavItems;

  // Mobile: include Home on subpages; on home match original (no Home item)
  const mobileItems = isHome
    ? allNavItems.filter((item) => item.href !== '/')
    : allNavItems;

  const isActive = (href: string): boolean => {
    if (href === '/' && isHome) return true;
    if (href === '/about' && pathname === '/about') return true;
    if (href === '/contact' && pathname === '/contact') return true;

    // Anchor links on homepage
    if (href === '/#why' && isHome && activeSection === 'why') return true;
    if (href === '/#services' && isHome && activeSection === 'services') return true;

    return false;
  };

  const linkClass = (href: string) =>
    `hover:text-[#c5a46e] transition-colors ${isActive(href) ? 'text-[#c5a46e] font-medium' : ''}`;

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f2c]/95 backdrop-blur border-b border-white/10">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Logo + Company Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/mh-logo.png"
            alt="MH Logo"
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-contain"
          />
          <span className="font-semibold text-lg tracking-[-0.3px] group-hover:text-[#c5a46e] transition-colors">
            {site.name}
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          {desktopItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA Button */}
        <Link
          href={resolvedCtaHref}
          className="hidden md:block px-6 py-2.5 bg-[#c5a46e] hover:bg-[#d4b57e] text-black text-sm font-medium rounded-full transition-all"
        >
          Book a Consultation
        </Link>

        {/* Hamburger - iOS Friendly */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className="md:hidden p-5 -mr-5 text-white active:bg-white/10 rounded-xl transition-colors touch-manipulation cursor-pointer select-none"
          role="button"
          aria-label="Toggle navigation menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? 'M6 18L18 6M6 6h12v12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0a0f2c] border-t border-white/10 py-4">
          <div className="max-w-5xl mx-auto px-6 flex flex-col gap-4 text-sm">
            {mobileItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-2 hover:text-[#c5a46e] transition-colors ${isActive(item.href) ? 'text-[#c5a46e] font-medium' : ''}`}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={resolvedCtaHref}
              className="mt-4 px-6 py-3 bg-[#c5a46e] hover:bg-[#d4b57e] text-black font-medium rounded-full text-center transition-all"
              onClick={closeMenu}
            >
              Book a Consultation
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
