/** Generate a filled retainer preview: node --experimental-strip-types scripts/preview-filled-retainer.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const tokenMap = {
  'Owner.FirstName': 'Michael',
  'Owner.LastName': 'Hart',
  'Owner.Company': 'Michael Hart Consulting Group LLC',
  'Owner.State': 'Georgia',
  'Owner.Email': 'michael@michaelhartconsulting.com',
  'Recipient.FirstName': 'Haik',
  'Recipient.LastName': 'Harutyunyan',
  'Recipient.Company': 'Athena Healthcare',
  'Recipient.Email': 'haikharutyunyan@yahoo.com',
  'Recipient.StreetAddress': '18801 Wyandotte Street',
  'Recipient.City': 'Reseda',
  'Recipient.State': 'CA',
  'Recipient.PostalCode': '91335',
  'Client.StreetAddress': '18801 Wyandotte Street',
  'Client.City': 'Reseda',
  'Client.State': 'CA',
  'Client.PostalCode': '91335',
  'Client.Company': 'Athena Healthcare',
  'Client.FirstName': 'Haik',
  'Client.LastName': 'Harutyunyan',
  'Customer.FirstName': 'Haik',
  'Customer.LastName': 'Harutyunyan',
  'Contractor.FirstName': 'Michael',
  'Contractor.LastName': 'Hart',
  'Recipient.FullName': 'Haik Harutyunyan',
  'Owner.FullName': 'Michael Hart',
  Date: 'June 24, 2026',
  'RETAINER AMOUNT': '4,500',
  'TOTAL PHASE 1 FEE': '12,000',
  'BALANCE DUE': '7,500',
  'ACTIVATION CREDITED': '38%',
  'Company website': 'michaelhartconsulting.com',
};

async function main() {
  const { fillPdfTokenBuffer } = await import('../lib/documents/fill-pdf-tokens.ts');
  const source = path.join(root, 'templates/legal/retainer-activation.pdf');
  const outPath = path.join(root, 'templates/legal/retainer-activation.test-filled.pdf');
  const pdf = fs.readFileSync(source);
  const out = await fillPdfTokenBuffer(pdf, tokenMap, 'retainer');
  fs.writeFileSync(outPath, out);
  console.log(`Preview written: ${outPath} (${out.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
