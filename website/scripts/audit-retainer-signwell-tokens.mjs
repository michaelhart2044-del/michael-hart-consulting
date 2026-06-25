/**
 * Audit retainer PDF bracket tokens vs SignWell template_fields map.
 * npm run audit:retainer-signwell
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pdfPath = path.join(root, 'templates/legal/retainer-activation.pdf');

const sampleSubmission = {
  id: 'audit-test',
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

async function collectPdfTokens() {
  const { ensurePdfJsNodeEnvironment } = await import('../lib/documents/pdfjs-node-setup.ts');
  await ensurePdfJsNodeEnvironment();
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(fs.readFileSync(pdfPath)),
    disableFontFace: true,
  }).promise;

  const byKey = new Map();
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    for (const raw of content.items) {
      if (!('str' in raw)) continue;
      const s = raw.str.trim();
      const m = s.match(/^\[(.+)\]$/);
      if (!m) continue;
      const key = m[1];
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(p);
    }
  }
  return byKey;
}

async function main() {
  const pdfTokens = await collectPdfTokens();
  const { buildDocumentMergeFields, mergeFieldsToPdfTokenMap } = await import(
    '../lib/documents/merge-fields.ts'
  );
  const fields = buildDocumentMergeFields(sampleSubmission, sampleClientDetails);
  const tokenMap = mergeFieldsToPdfTokenMap(fields);

  console.log('PDF:', pdfPath);
  console.log('Pages:', [...new Set([...pdfTokens.values()].flat())].length ? 'see tokens below' : '?');
  console.log('\n--- PDF bracket tokens ---');
  for (const [key, pages] of [...pdfTokens.entries()].sort()) {
    const covered = key in tokenMap ? 'OK' : 'MISSING in code map';
    console.log(`  [${key}]  pages ${[...new Set(pages)].join(',')}  → ${covered}`);
  }

  const missing = [...pdfTokens.keys()].filter((k) => !(k in tokenMap));
  const extra = Object.keys(tokenMap).filter((k) => !pdfTokens.has(k));

  console.log('\n--- Summary ---');
  console.log(`PDF tokens: ${pdfTokens.size}`);
  console.log(`Code map keys: ${Object.keys(tokenMap).length}`);
  console.log(`Missing mappings: ${missing.length ? missing.join(', ') : 'none'}`);
  console.log('\nSignWell will also receive Recipient.* / Owner.* aliases for the same values.');
  console.log('Match SignWell Text Field API IDs to either PDF token name OR Recipient.*/Owner.*');

  if (missing.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
