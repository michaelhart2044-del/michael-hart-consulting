'use client';

import { useState, useEffect, useRef } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isHome = pathname === '/';

  // Auto-override CTA on contact page so shared (marketing) layout works without per-page props
  const resolvedCtaHref = ctaHref ?? (pathname === '/contact' ? '#form' : '/contact#book');

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

    // Services pages (including subpages like /services/[slug])
    if (href === '/services' && pathname.startsWith('/services')) return true;

    // Anchor links on homepage
    if (href === '/#why' && isHome && activeSection === 'why') return true;
    if (href === '/#services' && isHome && activeSection === 'services') return true;

    return false;
  };

  const linkClass = (href: string) =>
    `hover:text-accent transition-colors ${isActive(href) ? 'text-accent font-medium' : ''}`;

  const closeMenu = () => setIsOpen(false);

  // Close mobile menu on click outside or Escape key (improves mobile UX and accessibility)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-white/10">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Logo + Company Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/mh-logo.png"
            alt="MH Logo"
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-contain"
          />
          <span className="font-semibold text-accent text-base md:text-lg tracking-[-0.3px] group-hover:text-accent-hover transition-colors whitespace-nowrap">
            <span className="md:hidden">MH Consulting</span>
            <span className="hidden md:inline">{site.name}</span>
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
          className="hidden md:block px-6 py-2.5 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black text-sm font-medium rounded-full transition-all active:scale-[0.985]"
        >
          Book a Consultation
        </Link>

        {/* Hamburger - iOS Friendly, animated to X for better UX */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className="md:hidden p-5 -mr-5 text-white active:bg-white/10 rounded-xl transition-colors touch-manipulation cursor-pointer select-none"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          ref={buttonRef}
        >
          <div className="relative h-6 w-6">
            <span
              className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-300 ${isOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-1'}`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-300 ${isOpen ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'top-3'}`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu - polished collapse animation for better mobile UX */}
      <div 
        id="mobile-menu" 
        ref={menuRef}
        className={`md:hidden bg-background/95 backdrop-blur border-t border-white/10 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 py-4' : 'max-h-0'}`}
      >
        <div className="max-w-5xl mx-auto px-6 flex flex-col gap-4 text-sm">
          {mobileItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`py-2 hover:text-accent transition-colors ${isActive(item.href) ? 'text-accent font-medium' : ''}`}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={resolvedCtaHref}
            className="mt-4 px-6 py-3 bg-[#8f6f3d] hover:bg-[#b89a6e] text-black font-medium rounded-full text-center transition-all active:scale-[0.985]"
            onClick={closeMenu}
          >
            Book a Consultation
          </Link>
        </div>
      </div>
    </nav>
  );
}
