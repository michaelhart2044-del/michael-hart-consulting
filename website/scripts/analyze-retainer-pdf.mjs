/** Analyze retainer PDF layout: node --experimental-strip-types scripts/analyze-retainer-pdf.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pdfPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../templates/legal/retainer-activation.pdf');

async function main() {
  const { ensurePdfJsNodeEnvironment } = await import('../lib/documents/pdfjs-node-setup.ts');
  await ensurePdfJsNodeEnvironment();
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)), disableFontFace: true }).promise;

  console.log(`Total pages: ${doc.numPages}\n`);

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const tokens = [];
    let snippet = '';
    for (const raw of content.items) {
      if (!('str' in raw)) continue;
      const str = raw.str.trim();
      if (!str) continue;
      const t = raw.transform;
      const key = str.match(/^\[(.+)\]$/)?.[1] ?? null;
      if (key) tokens.push({ key, x: Math.round(t[4]), y: Math.round(t[5]) });
      if (snippet.length < 100) snippet += (snippet ? ' ' : '') + str.slice(0, 40);
    }
    console.log(`--- page ${p} ---`);
    console.log('snippet:', snippet.slice(0, 100));
    if (tokens.length) {
      console.log('tokens:', tokens.map((t) => `${t.key}@${t.x},${t.y}`).join(' | '));
    }
    const hasPricing = content.items.some((i) => 'str' in i && /PRODUCT|PRICE|QUANTITY|Section total|\$0\.00/i.test(i.str));
    if (hasPricing) console.log('⚠ pricing table detected');
  }
}

main().catch(console.error);
