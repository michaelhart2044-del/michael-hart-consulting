import { MetadataRoute } from 'next';
import { getAllServiceSlugs } from '@/lib/services';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://michaelhartconsulting.com';

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
