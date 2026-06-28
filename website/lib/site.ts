export const site = {
  name: "Michael Hart Consulting Group LLC",
  legalName: "Michael Hart Consulting Group LLC",
  url: "https://www.michaelhartconsulting.com",
  email: "michael@michaelhartconsulting.com",
  // Verified Resend sender for all outbound transactional email
  resendFromEmail: "onboarding@michaelhartconsulting.com",
  phone: "(747) 370-9393",
  phoneHref: "tel:7473709393",
  tagline: "Strategic advisory for complex financial and business challenges.",
  description:
    "Expert financial advisory in operations, controls, automation, revenue accounting, financial close, and transformation. Helping organizations achieve efficiency, compliance, and strategic growth.",

  // Calendly — 30-min initial consultation (public prep flow)
  calendlyUrl: "https://calendly.com/michael-michaelhartconsulting/30min",
  // Calendly — 1-hour comprehensive meeting (client portal, post-agreement)
  comprehensiveCalendlyUrl:
    "https://calendly.com/michael-michaelhartconsulting/comprehensive-process-review-roadmap",

  // Social — LinkedIn only (B2B professional services; no consumer social needed)
  social: {
    linkedin: "https://www.linkedin.com/in/michael-hart-9a5092414",
  } as { linkedin?: string },

  // Brand logo (navbar, hero watermark, auth pages, favicon source)
  logo: "/mh-logo.png",
  /** Smaller square logo for PandaDoc API image blocks (1024px site logo overflows cover MH_Logo). */
  pandadocLogo: "/brand/mh-logo-pandadoc.png",

  // Open Graph image for metadata
  ogImage: "/og-image.png",
} as const;

export type Site = typeof site;