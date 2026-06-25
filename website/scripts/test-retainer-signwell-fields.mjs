/**
 * Dry-run SignWell retainer create — shows template_fields that would be sent.
 * npm run test:retainer-signwell
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const sampleSubmission = {
  id: 'signwell-test',
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

async function main() {
  process.env.SIGNWELL_PREFILL_TEMPLATE_FIELDS ??= 'true';
  process.env.SIGNWELL_PDF_PREFILL ??= 'false';

  const { buildSignWellDocumentRequest } = await import('../lib/signwell/create-owned-document.ts');
  const { getSignWellConfigStatus } = await import('../lib/signwell/config.ts');

  const configResult = getSignWellConfigStatus();
  if (!configResult.configured) {
    console.log('SignWell not configured locally — dry-run only (no API call).');
    console.log('Missing:', configResult.missing?.join(', ') ?? 'unknown');
  }

  const body = await buildSignWellDocumentRequest(
    'retainer',
    sampleSubmission,
    configResult.config ?? {
      apiKey: 'dry-run',
      testMode: true,
      templateRetainerId: process.env.SIGNWELL_TEMPLATE_RETAINER_ID ?? 'template-id',
      ownerPlaceholder: 'Owner',
      recipientPlaceholder: 'Recipient',
    },
    sampleClientDetails,
  );

  const fields = body.template_fields ?? [];
  console.log('\n--- template_fields (' + fields.length + ') ---');
  for (const f of fields.sort((a, b) => a.api_id.localeCompare(b.api_id))) {
    console.log(`  ${f.api_id} = ${f.value}`);
  }

  const pdfPath = path.join(root, 'templates/legal/retainer-activation.pdf');
  const stat = fs.statSync(pdfPath);
  console.log('\nPDF:', pdfPath, `(${stat.size} bytes)`);
  console.log('Draft document name:', body.name);
  console.log('\nSignWell fills Text Fields whose API ID matches api_id above.');
  console.log('PDF bracket text stays as-is until SignWell replaces field values on send.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
