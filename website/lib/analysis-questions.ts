/**
 * Discovery questions for the AI-Powered Process Analysis intake.
 * These feed directly into proposal generation (SigVai - internal only).
 * Kept in one place so the public form, email formatting, and any future
 * /admin tool all use the exact same structure and wording.
 */
export const analysisQuestions = [
  {
    id: 'closeCycle',
    number: 1,
    label: 'Current close / reporting cycle',
    prompt: 'How many business days does your typical month-end (and year-end) close take today? What is the single biggest bottleneck or time sink in the process right now?'
  },
  {
    id: 'teamEffort',
    number: 2,
    label: 'Team size & monthly effort',
    prompt: 'Roughly how many people are involved in the close/reconciliation/reporting work? How many total hours per month does the core manual work consume today?'
  },
  {
    id: 'systemsTools',
    number: 3,
    label: 'Systems and tools landscape',
    prompt: 'What ERP / accounting / GL system(s) are in use (SAP, NetSuite, Dynamics, Oracle, QuickBooks, etc.)? Any data warehouse, Power BI/Tableau, Blackline, or is a significant amount of work still in Excel + SQL + Power Query?'
  },
  {
    id: 'painPoints',
    number: 4,
    label: 'Top pain points & manual processes',
    prompt: 'Which specific processes are the most manual, repetitive, slow, or error-prone (e.g. particular reconciliations, intercompany, revenue recognition/cut-off, fixed assets, board/investor packages, audit PBC lists, flux analysis)?'
  },
  {
    id: 'successMetrics',
    number: 5,
    label: 'Definition of success',
    prompt: 'If this engagement (or just the 30-min analysis) is successful, what does "great" look like in the next 30-90 days? (target close days, hours saved per month, specific automation or controls delivered, audit/SOX milestone, better visibility for leadership, etc.)'
  },
  {
    id: 'stakeholdersDeadlines',
    number: 6,
    label: 'Stakeholders, deadlines & drivers',
    prompt: 'Who are the primary consumers of the close/results (CFO, PE sponsors, board, external auditors, operations leaders)? Any hard immovable deadlines, upcoming audits, or compliance deadlines we need to work around?'
  },
  {
    id: 'changesContext',
    number: 7,
    label: 'Upcoming changes or important context',
    prompt: 'Any major changes on the horizon (new ERP or system implementation, M&A / new entities or locations, headcount changes in finance, SOX or other compliance push, ASC 606/IFRS 15 issues, etc.)? Anything else Michael should know upfront to give the highest-value advice in our time together?'
  }
] as const;

export type AnalysisQuestion = typeof analysisQuestions[number];
