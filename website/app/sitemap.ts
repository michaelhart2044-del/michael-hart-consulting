import { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * Permanent fix for sitemap.xml 500 error in production.
 *
 * The previous dynamic approach (importing getAllServiceSlugs from services.tsx)
 * was causing intermittent 500 errors on Vercel (module evaluation / build vs runtime differences).
 *
 * This version uses a hardcoded, explicit list of all URLs.
 * - Zero chance of runtime errors during sitemap generation.
 * - Fully static (served directly by Vercel with no computation).
 * - Easy to maintain for this small site (update this list when adding/removing pages or services).
 *
 * Source of truth for service slugs remains lib/services.tsx — keep this list in sync.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = site.url;

  const lastModified = new Date();

  return [
    // Static pages
    { url: baseUrl, lastModified, changeFrequency: 'monthly' as const, priority: 1 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/prepare-analysis`, lastModified, changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/privacy-policy`, lastModified, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`, lastModified, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/services`, lastModified, changeFrequency: 'monthly' as const, priority: 0.7 },

    // All service pages (must stay in sync with slugs in lib/services.tsx)
    { url: `${baseUrl}/services/forensic-accounting-litigation-support`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/business-setup-structuring`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/mergers-acquisitions-advisory`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/financial-forecasting-strategy`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/ai-automation-solutions`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/website-design-development`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/revenue-accounting-compliance`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/month-end-close-reporting`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/sox-controls-audit-support`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/process-automation-finance-transformation`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/ai-assisted-software-development`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/services/finance-function-transformation`, lastModified, changeFrequency: 'monthly' as const, priority: 0.6 },
  ];
}
