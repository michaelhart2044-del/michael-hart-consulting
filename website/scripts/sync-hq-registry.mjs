/**
 * Sync Business HQ registry → website data/hq-projects.json + regenerate local dashboard.
 * Run: npm run hq:sync
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const websiteRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const businessRegistry = path.join(
  'C:',
  'MICHAEL HART CONSULTING GROUP LLC',
  '99__MASTER_HUB',
  'registry',
  'projects.json',
);
const websiteJson = path.join(websiteRoot, 'lib', 'hq', 'hq-projects.json');
const dashboardScript = path.join(
  'C:',
  'MICHAEL HART CONSULTING GROUP LLC',
  '99__MASTER_HUB',
  'scripts',
  'generate-dashboard.mjs',
);

if (!fs.existsSync(businessRegistry)) {
  console.error('Business registry not found:', businessRegistry);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(businessRegistry, 'utf8'));

const enriched = {
  ...raw,
  preLaunchChecklist: [
    {
      id: 'retainer-flow',
      label: 'SignWell retainer flow tested end-to-end',
      hint: 'Generate → sign → remittance PDF',
    },
    {
      id: 'qbo-coa',
      label: 'QBO chart of accounts + expense categories',
      hint: 'See 03_Finance/2026/QBO_Setup',
    },
    {
      id: 'amex-expenses',
      label: 'Record Amex business expenses + prepaid amortization',
      hint: 'Owner Contribution JEs in QBO',
    },
    {
      id: 'client-template',
      label: 'Client folder template ready in 02_Clients',
      hint: 'Copy _CLIENT_TEMPLATE per new client',
    },
    {
      id: 'intake-webhooks',
      label: 'Intake form + Calendly webhooks verified',
      hint: 'Test submission appears in admin',
    },
  ],
  externalLinks: [
    { id: 'signwell', label: 'SignWell', url: 'https://www.signwell.com/app/documents/' },
    { id: 'qbo', label: 'QuickBooks', url: 'https://qbo.intuit.com/' },
    {
      id: 'calendly',
      label: 'Calendly',
      url: 'https://calendly.com/app/scheduled_events/user/me',
    },
    { id: 'vercel', label: 'Vercel', url: 'https://vercel.com/dashboard' },
  ],
};

fs.mkdirSync(path.dirname(websiteJson), { recursive: true });
fs.writeFileSync(websiteJson, JSON.stringify(enriched, null, 2) + '\n', 'utf8');
console.log('Synced →', websiteJson);

if (fs.existsSync(dashboardScript)) {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, [dashboardScript], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
} else {
  console.warn('Dashboard script not found — skip local HTML regen');
}

console.log('HQ sync complete.');
