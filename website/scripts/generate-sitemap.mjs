import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const config = JSON.parse(
  readFileSync(join(root, "lib", "sitemap-config.json"), "utf8")
);

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.michaelhartconsulting.com";

const lastmod = new Date().toISOString().slice(0, 10);

const urls = [
  ...config.marketing.map(({ path, priority, changefreq }) => ({
    loc: `${baseUrl}${path}`,
    priority,
    changefreq,
  })),
  ...config.serviceSlugs.map((slug) => ({
    loc: `${baseUrl}/services/${slug}`,
    priority: "0.6",
    changefreq: "monthly",
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, priority, changefreq }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const outPath = join(root, "public", "sitemap.xml");
writeFileSync(outPath, xml, "utf8");
console.log(`Wrote ${urls.length} URLs to public/sitemap.xml`);
