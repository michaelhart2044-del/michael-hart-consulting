import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0f2c] text-[#f1f5f9]">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
