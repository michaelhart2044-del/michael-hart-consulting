'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function Analytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const consent = localStorage.getItem('mh-cookie-consent');
      setHasConsent(consent === 'accepted');
    };

    checkConsent();

    const handleConsentUpdate = () => checkConsent();
    window.addEventListener('mh-cookie-consent', handleConsentUpdate);

    return () => {
      window.removeEventListener('mh-cookie-consent', handleConsentUpdate);
    };
  }, []);

  if (!hasConsent) {
    return null;
  }

  return (
    <>
      {/* Microsoft Clarity */}
      <Script id="clarity-script" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "x2jdc6i4pa");
        `}
      </Script>

      {/* Google Analytics 4 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-4F2H29FYS7"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-4F2H29FYS7');
        `}
      </Script>
    </>
  );
}
