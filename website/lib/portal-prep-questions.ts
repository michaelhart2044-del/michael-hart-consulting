export type PortalPrepFieldType = 'select' | 'multiselect' | 'shorttext';

export interface PortalPrepField {
  id: string;
  label: string;
  helper?: string;
  type: PortalPrepFieldType;
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
}

/** Lightweight portal prep — most detail is captured in the 1-hour meeting. */
export const portalPrepQuestions: PortalPrepField[] = [
  {
    id: 'closeDays',
    label: 'How long does month-end close usually take?',
    type: 'select',
    options: [
      '5 business days or less',
      '6–10 business days',
      '11–15 business days',
      '16+ business days',
      'Not sure',
    ],
    required: true,
  },
  {
    id: 'erpSystem',
    label: 'Primary accounting / ERP system',
    type: 'select',
    options: [
      'QuickBooks',
      'NetSuite',
      'SAP',
      'Microsoft Dynamics',
      'Oracle',
      'Sage / Intacct',
      'Mostly Excel',
      'Other (describe below)',
      'Not sure',
    ],
    required: true,
  },
  {
    id: 'painAreas',
    label: 'Top pain areas right now (pick all that apply)',
    helper: 'Quick checkboxes — we will go deeper on the call.',
    type: 'multiselect',
    options: [
      'Month-end close too slow',
      'Manual reconciliations',
      'Heavy Excel work',
      'Reporting / board packages',
      'Controls / audit / compliance',
      'Staffing / capacity',
      'Other (describe below)',
    ],
    required: true,
  },
  {
    id: 'reportConsumers',
    label: 'Who mainly uses the close / financial results?',
    type: 'multiselect',
    options: ['CFO', 'Controller', 'Board', 'PE / investors', 'External audit', 'Operations leaders', 'Other'],
    required: true,
  },
  {
    id: 'upcomingChanges',
    label: 'Any major changes in the next 6 months?',
    type: 'select',
    options: [
      'None / steady state',
      'New ERP or system',
      'M&A / new entities',
      'Audit or compliance push',
      'Finance team changes',
      'Other (describe below)',
    ],
    required: true,
  },
  {
    id: 'additionalNotes',
    label: 'Anything else for Michael before the meeting?',
    helper: 'Optional — only if something important is not covered above.',
    type: 'shorttext',
    required: false,
    placeholder: 'Optional notes…',
  },
];