import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Shared layout for (marketing) route group - reduces duplication of Navbar/Footer
// across home, about, contact, services, etc. (Task #8 redo for deployment verification)
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </>
  );
}
