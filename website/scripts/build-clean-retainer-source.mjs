/**
 * Build SignWell-ready retainer source PDF from the PandaDoc export.
 * Reads templates/legal/retainer-activation.pre-signwell-clean.pdf (or --source path).
 * npm run build:clean-retainer
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'templates/legal/retainer-activation.pdf');
const backupPath = path.join(root, 'templates/legal/retainer-activation.pre-signwell-clean.pdf');

function resolveSourcePath() {
  const arg = process.argv.find((a) => a.startsWith('--source='));
  if (arg) return arg.slice('--source='.length);
  if (fs.existsSync(backupPath)) return backupPath;
  return outPath;
}

async function countBrackets(pdfPath) {
  const { ensurePdfJsNodeEnvironment } = await import('../lib/documents/pdfjs-node-setup.ts');
  await ensurePdfJsNodeEnvironment();
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(fs.readFileSync(pdfPath)),
    disableFontFace: true,
  }).promise;
  let brackets = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    for (const raw of content.items) {
      if (!('str' in raw)) continue;
      const s = raw.str;
      if (/\[[^\]]+\]/.test(s)) brackets++;
    }
  }
  return { pages: doc.numPages, brackets };
}

async function main() {
  const sourcePath = resolveSourcePath();
  if (!fs.existsSync(sourcePath)) {
    console.error('Source not found:', sourcePath);
    process.exit(1);
  }

  const source = fs.readFileSync(sourcePath);
  if (!process.argv.some((a) => a.startsWith('--source=')) && sourcePath !== outPath && !fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, source);
    console.log('Backup created:', backupPath);
  }

  const { buildCleanRetainerSourcePdf } = await import('../lib/documents/build-clean-retainer-pdf.ts');
  const cleaned = await buildCleanRetainerSourcePdf(source);
  fs.writeFileSync(outPath, cleaned);

  const after = await countBrackets(outPath);
  console.log('Source:', sourcePath);
  console.log('Written:', outPath);
  console.log(`Pages: ${after.pages} | visible bracket tokens in text layer: ${after.brackets}`);
  console.log('(Bracket strings may remain hidden under white boxes — open the PDF visually to verify.)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
