import { MetadataRoute } from 'next';
import { getAllServiceSlugs } from '@/lib/services';
import { site } from '@/lib/site';

// Fixed to dynamically use getAllServiceSlugs() from lib/services.ts (instead of hardcoding slugs)
// to resolve the live sitemap.xml 500 error. Also uses site.url for consistency.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = site.url;

  const staticPages = [
    { url: baseUrl, changeFrequency: 'monthly' as const, priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/privacy-policy`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/services`, changeFrequency: 'monthly' as const, priority: 0.7 },
  ];

  const serviceSlugs = getAllServiceSlugs();

  const servicePages = serviceSlugs.map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages.map((page) => ({
      ...page,
      lastModified: new Date(),
    })),
    ...servicePages,
  ];
}
