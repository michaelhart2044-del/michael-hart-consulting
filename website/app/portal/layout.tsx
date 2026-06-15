import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Private Client Portal',
  description: 'Private client portal for engaged clients of Michael Hart Consulting Group LLC.',
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}