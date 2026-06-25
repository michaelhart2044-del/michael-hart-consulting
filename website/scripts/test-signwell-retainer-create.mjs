/** Create a real SignWell retainer draft (test) using PDF prefill path */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const sampleSubmission = {
  id: 'live-test',
  name: 'Haik Harutyunyan',
  email: 'haikharutyunyan@yahoo.com',
  clientCompany: 'Athena Healthcare',
  clientStreetAddress: '18801 Wyandotte Street',
  clientCity: 'Reseda',
  clientState: 'CA',
  clientPostalCode: '91335',
  engagementQuote: {
    savedAt: new Date().toISOString(),
    activationFee: 4500,
    totalFee: 12000,
    balanceDue: 7500,
    creditPercent: 38,
  },
};

const sampleClientDetails = {
  company: 'Athena Healthcare',
  streetAddress: '18801 Wyandotte Street',
  city: 'Reseda',
  state: 'CA',
  postalCode: '91335',
};

const { getSignWellRetainerConfigStatus } = await import('../lib/signwell/config.ts');
const { createOwnedSignWellDocument } = await import('../lib/signwell/create-owned-document.ts');
const { resolveSignWellDocumentEditUrl } = await import('../lib/signwell/client.ts');

const status = getSignWellRetainerConfigStatus();
if (!status.configured || !status.config) {
  console.error('SignWell not configured');
  process.exit(1);
}

const doc = await createOwnedSignWellDocument(
  'retainer',
  sampleSubmission,
  status.config,
  sampleClientDetails,
);

console.log('Created SignWell document:', doc.id);
console.log('Open:', resolveSignWellDocumentEditUrl(doc));
