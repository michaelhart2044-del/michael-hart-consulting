/** Dump text item positions for any PDF path */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const showAll = args.includes('--all');
const filtered = args.filter((a) => a !== '--all');
const pdfPath = filtered[0];
const pages = filtered.slice(1).map(Number).filter(Boolean);

if (!pdfPath) {
  console.error('Usage: npx tsx scripts/dump-pdf-positions.mjs <pdf-path> [pages...]');
  process.exit(1);
}

async function main() {
  const { ensurePdfJsNodeEnvironment } = await import('../lib/documents/pdfjs-node-setup.ts');
  await ensurePdfJsNodeEnvironment();
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data, disableFontFace: true }).promise;
  console.log('Pages:', doc.numPages);
  const targetPages = pages.length ? pages : Array.from({ length: doc.numPages }, (_, i) => i + 1);

  for (const p of targetPages) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const tokens = [];
    console.log(`\n=== PAGE ${p} ===`);
    for (const raw of content.items) {
      if (!('str' in raw)) continue;
      const s = raw.str.trim();
      if (!s) continue;
      const x = Math.round(raw.transform[4]);
      const y = Math.round(raw.transform[5]);
      const w = Math.round(raw.width || 0);
      const key = s.match(/^\[(.+)\]$/)?.[1] ?? null;
      if (key) tokens.push({ key, x, y, w, s });
      else if (/\[[^\]]+\]/.test(s)) tokens.push({ key: 'partial', x, y, w, s: s.slice(0, 80) });
    }
    if (tokens.length) {
      for (const t of tokens) console.log(t);
    } else if (!showAll) {
      console.log('(no bracket tokens)');
    }
    if (showAll) {
      for (const raw of content.items) {
        if (!('str' in raw)) continue;
        const s = raw.str.trim();
        if (!s) continue;
        console.log({
          y: Math.round(raw.transform[5]),
          x: Math.round(raw.transform[4]),
          s: s.slice(0, 90),
        });
      }
    }
  }
}

main().catch(console.error);
