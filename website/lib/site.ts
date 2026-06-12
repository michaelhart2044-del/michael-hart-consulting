export const site = {
  name: "Michael Hart Consulting Group LLC",
  legalName: "Michael Hart Consulting Group LLC",
  url: "https://michaelhartconsulting.com",
  email: "michael@michaelhartconsulting.com",
  phone: "(747) 370-9393",
  phoneHref: "tel:7473709393",
  tagline: "Strategic advisory for complex financial and business challenges.",
  description:
    "Expert financial advisory in operations, controls, automation, revenue accounting, financial close, and transformation. Helping organizations achieve efficiency, compliance, and strategic growth.",

  // Calendly scheduling link (used on /contact page)
  calendlyUrl: "https://calendly.com/michael-michaelhartconsulting/30min",

  // Social links (add your actual profile URLs to enable icons in the footer)
  social: {
    linkedin: "https://www.linkedin.com/in/michael-hart-9a5092414",
  } as { linkedin?: string },

  // Open Graph image for metadata
  ogImage: "/og-image.png",
} as const;

export type Site = typeof site;