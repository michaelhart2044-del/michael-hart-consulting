export const site = {
  name: "Michael Hart Consulting Group LLC",
  legalName: "Michael Hart Consulting Group LLC",
  url: "https://michaelhartconsulting.com",
  email: "michael@michaelhartconsulting.com",
  phone: "(747) 370-9393",
  phoneHref: "tel:7473709393",
  tagline: "Strategic advisory for complex financial and business challenges.",
  description:
    "Expert advisory in revenue accounting, financial close, SOX controls, process automation, AI-assisted software development, finance function transformation, financial forecasting, and AI solutions. Helping organizations optimize operations and deliver clear results.",
  // Social links (update these with real profiles)
  social: {
    linkedin: "https://www.linkedin.com/in/yourprofile",
    x: "https://x.com/yourhandle",
  },
  // Calendly scheduling link for consultations (replace with your actual Calendly URL)
  calendlyUrl: "https://calendly.com/yourusername/30min",
} as const;

export type Site = typeof site;
