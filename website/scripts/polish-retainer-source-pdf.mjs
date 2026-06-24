/**
 * One-time cleanup of templates/legal/retainer-activation.pdf
 * Run: node scripts/polish-retainer-source-pdf.mjs
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const target = path.join(root, 'templates', 'legal', 'retainer-activation.pdf');
const backup = path.join(root, 'templates', 'legal', 'retainer-activation.pre-polish.pdf');

const WHITE = rgb(1, 1, 1);
const BODY = rgb(0.05, 0.05, 0.05);
const FONT_SIZE = 10;

async function polishRetainerSourcePdf(buffer) {
  const pdfDoc = await PDFDocument.load(buffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pageCount = pdfDoc.getPageCount();

  if (pageCount >= 15) {
    pdfDoc.removePage(pageCount - 1);
  }

  if (pdfDoc.getPageCount() < 14) {
    return buffer;
  }

  const pages = pdfDoc.getPages();
  const attachmentA = pages[12];
  const attachmentB = pages[13];

  attachmentB.drawRectangle({ x: 28, y: 612, width: 560, height: 128, color: WHITE, borderWidth: 0 });
  attachmentB.drawRectangle({ x: 28, y: 78, width: 560, height: 98, color: WHITE, borderWidth: 0 });

  const deliverables = [
    '• Engagement setup summary',
    '• Preliminary findings memo or executive summary',
    '• Recommended 30–90 day roadmap / next-phase scope outline',
  ];

  attachmentA.drawRectangle({ x: 28, y: 34, width: 560, height: 58, color: WHITE, borderWidth: 0 });

  deliverables.forEach((line, index) => {
    attachmentA.drawText(line, {
      x: 37,
      y: 71 - index * 16,
      size: FONT_SIZE,
      font,
      color: BODY,
    });
  });

  return Buffer.from(await pdfDoc.save());
}

async function main() {
  let source;
  try {
    source = await fs.readFile(target);
  } catch {
    console.error(`Source not found: ${target}`);
    process.exit(1);
  }

  try {
    await fs.access(backup);
    console.log(`Backup already exists: ${backup}`);
  } catch {
    await fs.copyFile(target, backup);
    console.log(`Backup saved: ${backup}`);
  }

  const polished = await polishRetainerSourcePdf(source);
  await fs.writeFile(target, polished);
  console.log(`Polished retainer PDF written (${polished.length} bytes): ${target}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
