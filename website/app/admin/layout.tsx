import type { Metadata } from 'next';

export const maxDuration = 60;

export const metadata: Metadata = {
  title: 'Internal — Engagement Hub',
  description: 'Private tool — Michael Hart Consulting',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9]">
      {/* Minimal secure header — no public navigation */}
      <header className="border-b border-white/10 bg-[#0f172a]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#8f6f3d] flex items-center justify-center">
              <span className="text-black font-semibold text-sm">MH</span>
            </div>
            <div>
              <div className="font-semibold tracking-tight">Michael Hart Consulting</div>
              <div className="text-[10px] text-[#64748b] -mt-0.5">PRIVATE • INTERNAL USE ONLY</div>
            </div>
          </div>
          <a
            href="#hq-command-center"
            className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#94a3b8] hover:border-[#c5a46e]/50 hover:text-[#c5a46e] transition-colors"
          >
            HQ Command Center
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-white/10 py-4 text-center text-[11px] text-[#64748b]">
        This area is access-controlled and excluded from search engines.
      </footer>
    </div>
  );
}
