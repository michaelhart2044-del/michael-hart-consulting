export const site = {
  name: "Michael Hart Consulting Group LLC",
  legalName: "Michael Hart Consulting Group LLC",
  url: "https://michaelhartconsulting.com",
  email: "michael@michaelhartconsulting.com",
  phone: "(747) 370-9393",
  phoneHref: "tel:7473709393",
  tagline: "Strategic advisory for complex financial and business challenges.",
  description:
    "Expert advisory in revenue accounting, financial close, SOX controls, process automation, financial forecasting, and AI solutions. Helping organizations optimize operations and deliver clear results.",
  // Social links (update these with real profiles)
  social: {
    linkedin: "https://www.linkedin.com/in/yourprofile",
    x: "https://x.com/yourhandle",
  },
} as const;

export type Site = typeof site;
