export const site = {
  name: "Michael Hart Consulting Group LLC",
  legalName: "Michael Hart Consulting Group LLC",
  url: "https://michaelhartconsulting.com",
  email: "michael@michaelhartconsulting.com",
  phone: "(747) 370-9393",
  phoneHref: "tel:7473709393",
  tagline: "Strategic advisory for complex financial and business challenges.",
  description:
    "Expert advisory in forensic accounting, mergers & acquisitions, financial strategy, and AI-powered business solutions. Helping businesses and legal teams make confident decisions.",

  // Calendly scheduling link (used on /contact page)
  calendlyUrl: "https://calendly.com/michael-michaelhartconsulting/30min",

  // Social links (placeholders for now)
  social: {
    // linkedin: "https://www.linkedin.com/in/yourprofile",
    // twitter: "https://x.com/yourhandle",
  },
} as const;

export type Site = typeof site;