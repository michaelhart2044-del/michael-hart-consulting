import Link from 'next/link';
import type { Metadata } from 'next';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: `Sorry, the page you’re looking for doesn’t exist. | ${site.name}`,
  openGraph: {
    title: `Page Not Found | ${site.name}`,
    description: `Sorry, the page you’re looking for doesn’t exist.`,
    images: [
      {
        url: site.ogImage,
        width: 1200,
        height: 630,
        alt: `${site.name} - ${site.tagline}`,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Page Not Found | ${site.name}`,
    description: `Sorry, the page you’re looking for doesn’t exist.`,
    images: [site.ogImage],
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="max-w-md text-center px-6">
        <div className="text-6xl font-semibold tracking-[-2px] mb-2 text-accent">404</div>
        <h1 className="text-3xl font-semibold tracking-tight mb-4">Page not found</h1>
        <p className="text-muted mb-8 leading-relaxed">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-accent hover:bg-accent-hover text-black font-medium rounded-full transition-all active:scale-[0.985] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
        >
          Back to home
        </Link>
        <p className="mt-6 text-xs text-subtle">
          Or <Link href="/contact" className="underline hover:text-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent rounded">contact us</Link> if you need help.
        </p>
      </div>
    </div>
  );
}
