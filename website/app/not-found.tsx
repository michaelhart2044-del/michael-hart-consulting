import Link from 'next/link';

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
          className="inline-block px-8 py-3 bg-accent hover:bg-accent-hover text-black font-medium rounded-full transition-all active:scale-[0.985]"
        >
          Back to home
        </Link>
        <p className="mt-6 text-xs text-subtle">
          Or <Link href="/contact" className="underline hover:text-accent">contact us</Link> if you need help.
        </p>
      </div>
    </div>
  );
}
