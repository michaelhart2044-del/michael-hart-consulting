export const site = {
  name: "Michael Hart Consulting Group LLC",
  legalName: "Michael Hart Consulting Group LLC",
  url: "https://michaelhartconsulting.com",
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

  // Social links (add your actual profile URLs to enable icons in the footer)
  social: {
    linkedin: "https://www.linkedin.com/in/michael-hart-9a5092414",
  } as { linkedin?: string },

  // Brand logo (navbar, hero watermark, auth pages, favicon source)
  logo: "/mh-logo.png",

  // Open Graph image for metadata
  ogImage: "/og-image.png",
} as const;

export type Site = typeof site;