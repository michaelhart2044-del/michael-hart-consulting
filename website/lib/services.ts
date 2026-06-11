import type { ReactNode } from 'react';

// Core services data - source of truth for detail pages, home links, schema, etc.
export interface Service {
  slug: string;
  title: string;
  shortDesc: string;
  longIntro: string;
  deliverables: string[];
  whoFor: string[];
  approach: string[];
  // For schema / meta
  description: string; // meta desc
}

export const services: Service[] = [
  {
    slug: 'forensic-accounting-litigation-support',
    title: 'Forensic Accounting & Litigation Support',
    shortDesc: 'Expert analysis and support for disputes, investigations, and legal proceedings.',
    longIntro: 'We provide independent, defensible forensic accounting services to law firms, corporations, and government agencies involved in complex disputes, fraud investigations, and litigation. Our work is designed to withstand scrutiny in court or arbitration.',
    deliverables: [
      'Damage calculations and lost profits analysis',
      'Fraud investigation and asset tracing',
      'Financial statement analysis and reconstruction',
      'Expert reports and testimony support',
      'Discovery assistance and data analytics',
    ],
    whoFor: [
      'Litigation counsel and law firms',
      'Corporate legal and compliance teams',
      'Insurance carriers and claims professionals',
      'Government agencies and regulators',
    ],
    approach: [
      'Independent, objective analysis grounded in facts and GAAP/GAAS principles.',
      'Clear, concise deliverables that translate complex financial data into actionable insights.',
      'Collaboration with counsel from early case assessment through trial.',
    ],
    description: 'Expert forensic accounting and litigation support for disputes, fraud investigations, and legal proceedings. Independent analysis and expert testimony.',
  },
  {
    slug: 'business-setup-structuring',
    title: 'Business Setup & Structuring',
    shortDesc: 'Strategic guidance on company formation, ownership structures, and operational frameworks.',
    longIntro: 'We help entrepreneurs, executives, and investors design and implement efficient, tax-advantaged, and governance-strong business structures. Whether launching a new venture or reorganizing an existing enterprise, we align structure with strategic and operational goals.',
    deliverables: [
      'Entity selection and formation (LLC, Corp, LP, etc.)',
      'Ownership and equity structuring',
      'Operating agreements, bylaws, and governance documents',
      'Tax planning and multi-state considerations',
      'Succession and exit planning frameworks',
    ],
    whoFor: [
      'Founders and early-stage companies',
      'Family businesses and closely held enterprises',
      'Private equity and investment groups',
      'Professionals forming practices or partnerships',
    ],
    approach: [
      'Holistic view that balances tax efficiency, liability protection, governance, and future flexibility.',
      'Clear documentation and implementation support.',
      'Ongoing advisory as the business evolves.',
    ],
    description: 'Strategic guidance on company formation, ownership structures, governance, and tax-efficient business frameworks for founders and enterprises.',
  },
  {
    slug: 'mergers-acquisitions-advisory',
    title: 'Mergers & Acquisitions Advisory',
    shortDesc: 'End-to-end support for buying, selling, and integrating businesses with financial and strategic precision.',
    longIntro: 'We advise buyers and sellers through the full M&A lifecycle — from target identification and due diligence through negotiation, structuring, and post-close integration. Our forensic and financial expertise helps clients avoid surprises and maximize value.',
    deliverables: [
      'Buy-side and sell-side due diligence',
      'Quality of earnings and working capital analysis',
      'Valuation support and deal modeling',
      'Integration planning and synergy tracking',
      'Post-close dispute resolution and earn-out support',
    ],
    whoFor: [
      'Private equity firms and strategic acquirers',
      'Business owners preparing for sale',
      'Family offices and corporate development teams',
      'Management teams pursuing acquisitions',
    ],
    approach: [
      'Deep financial scrutiny combined with commercial judgment.',
      'Transparent communication and realistic expectations.',
      'Focus on value creation before, during, and after the transaction.',
    ],
    description: 'Comprehensive M&A advisory including due diligence, valuation, structuring, and integration for buyers and sellers seeking precision and value.',
  },
  {
    slug: 'financial-forecasting-strategy',
    title: 'Financial Forecasting & Strategy',
    shortDesc: 'Data-driven forecasting, scenario planning, and long-term financial strategy development.',
    longIntro: 'We build robust financial models and strategic frameworks that help leadership teams make confident decisions about growth, capital allocation, and risk. Our forecasts are practical, stress-tested, and tied directly to operational drivers. We incorporate revenue accounting, variance analysis, and cross-functional collaboration with FP&A and operations.',
    deliverables: [
      'Three-statement financial models and forecasts',
      'Scenario and sensitivity analysis',
      'Budgeting and long-range planning processes',
      'Capital structure and liquidity planning',
      'Board and investor reporting packages',
      'Revenue stream analysis and variance reporting',
      'Driver-based budgeting and forecasting tied to operational metrics',
    ],
    whoFor: [
      'CEOs, CFOs, and finance teams',
      'Boards and investors requiring clear visibility',
      'Companies preparing for fundraising or exit',
      'Organizations navigating uncertainty or rapid change',
    ],
    approach: [
      'Driver-based modeling rather than simple extrapolations.',
      'Clear assumptions, risks, and mitigation paths.',
      'Models designed for ongoing use and iteration, not one-time reports.',
    ],
    description: 'Data-driven financial forecasting, scenario planning, budgeting, and strategic finance support to guide confident business decisions.',
  },
  {
    slug: 'ai-automation-solutions',
    title: 'AI & Automation Solutions',
    shortDesc: 'Implementing intelligent systems that improve decision-making, efficiency, and financial processes.',
    longIntro: 'We help organizations identify high-impact opportunities to apply AI, machine learning, and intelligent automation to finance, operations, and advisory workflows. Our focus is practical implementation with measurable ROI, strong governance, and human oversight. We leverage tools like SQL, Power Query, Power BI, and ERP systems to transform manual processes.',
    deliverables: [
      'Opportunity assessment and use-case prioritization',
      'Custom AI/automation pilots and production deployments',
      'Data strategy, cleaning, and pipeline development',
      'Governance, risk, and compliance frameworks for AI',
      'Training and change management for teams',
      'SQL-powered automated reconciliations and Power Query data pipelines',
      'ERP system migration support (e.g., SL-Dynamics to PeopleSoft)',
    ],
    whoFor: [
      'Finance and accounting teams seeking efficiency',
      'Professional services firms modernizing delivery',
      'Mid-market companies ready to scale operations',
      'Leaders wanting to augment (not replace) expertise with technology',
    ],
    approach: [
      'Start with the problem, not the technology.',
      'Build solutions that are explainable, auditable, and maintainable.',
      'Combine deep domain knowledge with modern tooling.',
    ],
    description: 'Practical AI and intelligent automation implementations that enhance financial processes, decision-making, and operational efficiency with strong governance.',
  },
  {
    slug: 'website-design-development',
    title: 'Website Design & Development',
    shortDesc: 'Modern, professional websites and web applications tailored to your brand and business goals.',
    longIntro: 'We design and build high-performing, conversion-focused websites and web applications for professional services firms and sophisticated businesses. Our work emphasizes clarity, trust, performance, and seamless integration with marketing and operations.',
    deliverables: [
      'Custom design systems and brand-aligned experiences',
      'High-performance Next.js / modern web applications',
      'SEO foundations, analytics, and conversion tracking',
      'Content strategy and copy that converts',
      'Ongoing maintenance, optimization, and feature development',
    ],
    whoFor: [
      'Consulting firms and professional services practices',
      'Private equity portfolio companies',
      'Boutique advisory and expert firms',
      'Organizations that want their digital presence to match their expertise',
    ],
    approach: [
      'Premium aesthetic with obsessive attention to performance and usability.',
      'Strategic content and clear calls-to-action that drive inquiries.',
      'Built for longevity, easy updates, and measurable results.',
    ],
    description: 'Premium, high-performance website design and development for consulting firms and professional services businesses that need to build trust and generate opportunities online.',
  },
  {
    slug: 'revenue-accounting-compliance',
    title: 'Revenue Accounting & Compliance',
    shortDesc: 'ASC 606, fee-for-service, and precise revenue recognition with analysis and reconciliations.',
    longIntro: 'We manage revenue accounting activities including journal entries, fee-for-service (FFS) postings, and monthly revenue analysis. We ensure compliance with ASC 606, validate revenue streams, and resolve anomalies in partnership with revenue operations.',
    deliverables: [
      'ASC 606 revenue recognition and FFS postings',
      'Monthly revenue analysis and stream validation',
      'Blackline reconciliations and adjusting entries',
      'Ad-hoc reporting on revenue trends, behavior, and variances',
      'Cross-functional collaboration to validate and optimize revenue processes',
    ],
    whoFor: [
      'Finance and revenue operations teams in public and PE-backed companies',
      'Organizations with complex multi-line or subscription-based revenue',
      'Companies undergoing system migrations or process standardization',
      'Leadership needing clear revenue visibility and analysis',
    ],
    approach: [
      'Detail-oriented analysis combined with automation for speed and accuracy.',
      'Focus on compliance, scalability, and real-time collaboration across teams.',
      'Integration of tools like SQL and Power Query for efficient data handling.',
    ],
    description: 'Expert revenue accounting and compliance services for ASC 606, FFS postings, reconciliations, and analysis to ensure accurate and timely financial reporting.',
  },
  {
    slug: 'month-end-close-reporting',
    title: 'Month-End Close & Financial Reporting',
    shortDesc: 'Streamlined close processes, reconciliations, variance analysis, and high-quality reporting.',
    longIntro: 'We optimize month-end and year-end close, general ledger management, cash reconciliations, and variance analysis. We turn time-intensive manual processes into automated, auditable workflows that reduce cycle times while strengthening accuracy and controls.',
    deliverables: [
      'Month-end and year-end close management and acceleration',
      'General ledger review, cash reconciliation, and variance analysis',
      'Preparation of financial reporting packages and board/investor reports',
      'Capital asset accounting, depreciation schedules, and deferred rent',
      'Policy implementation, internal controls, and process standardization',
    ],
    whoFor: [
      'Finance teams in multi-location or high-growth organizations',
      'Companies seeking to reduce close timelines and improve reporting quality',
      'Organizations implementing new ERP systems or automation tools',
      'Leaders needing reliable, timely financial visibility',
    ],
    approach: [
      'Standardization and automation to drive efficiency and repeatability.',
      'Focus on controls, accuracy, and cross-functional partnership.',
      'Use of tools like Blackline, Expensify, and ERP integrations for speed.',
    ],
    description: 'Expert support for month-end close, financial reporting, reconciliations, and controls to deliver faster, more reliable results.',
  },
  {
    slug: 'sox-controls-audit-support',
    title: 'SOX Controls & Audit Support',
    shortDesc: 'Implementation of SOX controls, audit readiness, and resolution of external inquiries.',
    longIntro: 'We strengthen internal controls, support SOX compliance, and assist with external audits. We collaborate with auditors to resolve inquiries, implement stronger controls, and prepare supporting documentation for smooth reviews.',
    deliverables: [
      'SOX controls design, implementation, and testing',
      'Audit support and inquiry resolution (e.g., with PwC and other firms)',
      'Fixed asset subledger reconciliation and tax schedule preparation',
      'Leasing classification analysis (FAS 13) and related calculations',
      'Documentation and evidence packages for compliance and audits',
    ],
    whoFor: [
      'Public and PE-backed companies subject to SOX requirements',
      'Organizations preparing for or undergoing external audits',
      'Finance teams needing to strengthen controls and documentation',
      'Companies in transition or post-acquisition integration phases',
    ],
    approach: [
      'Rigorous, evidence-based support grounded in GAAP and regulatory requirements.',
      'Proactive identification of control gaps and practical remediation.',
      'Close partnership with auditors and internal stakeholders for efficient resolution.',
    ],
    description: 'Comprehensive SOX controls implementation, audit support, and compliance documentation for public and regulated organizations.',
  },
  {
    slug: 'process-automation-finance-transformation',
    title: 'Process Automation & Finance Transformation',
    shortDesc: 'Automation of manual workflows using SQL, Power Query, Power BI, and ERP tools for scalable operations.',
    longIntro: 'We help finance teams automate time-consuming processes such as reconciliations, data refreshes, and reporting. Using SQL, Power Query, Power BI, and modern ERP platforms, we reduce manual effort, improve accuracy, and enable real-time collaboration across teams.',
    deliverables: [
      'Design and implementation of automated reconciliation and reporting processes',
      'SQL and Power Query solutions for monthly data pipelines and refreshes',
      'Power BI dashboards and variance analysis tools',
      'ERP migration support and system integration (e.g., SL-Dynamics to PeopleSoft, SAP)',
      'Workflow automation using tools like Salesforce, Blackline, and Expensify',
      'Training and change management to ensure adoption and sustainability',
    ],
    whoFor: [
      'Finance and accounting teams burdened by manual, time-intensive processes',
      'Organizations implementing new ERP systems or modernizing legacy tools',
      'Teams seeking to scale operations without adding headcount',
      'Leaders focused on efficiency, accuracy, and data-driven decision making',
    ],
    approach: [
      'Start with pain points and manual bottlenecks, then apply targeted automation.',
      'Combine technical tools with process redesign and team enablement.',
      'Focus on measurable time savings, error reduction, and ongoing maintainability.',
    ],
    description: 'Practical automation and transformation services that modernize finance operations using SQL, Power Query, Power BI, ERP tools, and workflow automation.',
  },
  {
    slug: 'ai-assisted-software-development',
    title: 'AI-Assisted Software Development',
    shortDesc: 'Building custom tools, scripts, and applications with AI to automate and optimize financial processes.',
    longIntro: 'Drawing from hands-on experience developing software solutions with the help of AI, we create tailored applications, integrations, and automation scripts that connect with ERP, CRM, and other systems to eliminate manual work and improve accuracy and speed.',
    deliverables: [
      'Custom script and tool development using AI-assisted coding',
      'Integrations between financial systems and productivity tools',
      'Automated data pipelines and reporting applications',
      'Prototyping and rapid iteration of internal tools',
      'Training and knowledge transfer on AI-assisted development',
    ],
    whoFor: [
      'Finance and accounting teams wanting to build proprietary tools',
      'Organizations modernizing legacy systems without large dev teams',
      'Leaders seeking to accelerate digital transformation in finance ops',
      'Companies looking to leverage AI for custom automation solutions',
    ],
    approach: [
      'Combine domain expertise with AI tools for rapid, high-quality development.',
      'Focus on practical, maintainable, and auditable solutions.',
      'Emphasize integration with existing systems and team enablement.',
    ],
    description: 'AI-assisted custom software development for finance teams, including tools, scripts, integrations, and automation tailored to operational needs.',
  },
  {
    slug: 'finance-function-transformation',
    title: 'Finance Function Transformation & Leadership',
    shortDesc: 'Modernizing finance teams and operations through automation, controls, and strategic leadership.',
    longIntro: 'With experience building and leading accounting teams from the ground up, implementing robust controls, and driving large-scale process improvements, we advise on transforming finance functions to be more efficient, compliant, and strategically valuable.',
    deliverables: [
      'Finance team assessments, structure, and capability development',
      'Automation and controls implementation roadmaps',
      'Process redesign for close, reporting, and compliance functions',
      'Leadership development, training, and mentoring programs',
      'Change management and sustainable adoption support',
    ],
    whoFor: [
      'Growing or PE-backed companies professionalizing finance operations',
      'Organizations post-acquisition or in rapid growth phases',
      'CFOs and finance leaders looking to upskill teams and modernize processes',
      'Companies seeking to reduce costs while increasing control and output',
    ],
    approach: [
      'Grounded in real-world, hands-on implementation experience.',
      'Balance technical improvements with people, culture, and leadership.',
      'Deliver measurable, sustainable transformations with clear ROI.',
    ],
    description: 'Comprehensive finance function transformation services combining process automation, internal controls, and leadership development for high-performing teams.',
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getAllServiceSlugs(): string[] {
  return services.map((s) => s.slug);
}
