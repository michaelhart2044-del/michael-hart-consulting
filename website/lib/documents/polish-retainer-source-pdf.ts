/**
 * One-time structural cleanup on the PandaDoc-exported retainer source PDF:
 * - Remove trailing pricing-only page
 * - Remove PRODUCT / PRICE / QUANTITY / TOTAL table ($0.00)
 * - Move orphaned Deliverables bullets onto Attachment A page 1
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const WHITE = rgb(1, 1, 1);
const BODY = rgb(0.05, 0.05, 0.05);
const FONT_SIZE = 10;

export async function polishRetainerSourcePdf(buffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(buffer);
  const pageCount = pdfDoc.getPageCount();

  // Already-clean exports (14 pages, no pricing spill page) — skip destructive polish.
  if (pageCount === 14) {
    // Heuristic: new PandaDoc exports use "Customer Responsibilities" on page 14 instead of a pricing table.
    const bytes = buffer.toString('latin1');
    if (bytes.includes('Customer Responsibilities') && !bytes.includes('Section total')) {
      return buffer;
    }
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Only strip the trailing PandaDoc pricing spill page (page 15 in the original export).
  if (pageCount >= 15) {
    pdfDoc.removePage(pageCount - 1);
  }

  if (pdfDoc.getPageCount() < 14) {
    return buffer;
  }

  const pages = pdfDoc.getPages();
  const attachmentA = pages[12]; // page 13
  const attachmentB = pages[13]; // page 14

  // Cover orphan deliverable bullets that ran onto the next page header band.
  attachmentB.drawRectangle({
    x: 28,
    y: 612,
    width: 560,
    height: 128,
    color: WHITE,
    borderWidth: 0,
  });

  // Cover PandaDoc pricing table + section total ($0.00).
  attachmentB.drawRectangle({
    x: 28,
    y: 78,
    width: 560,
    height: 98,
    color: WHITE,
    borderWidth: 0,
  });

  // Place all three deliverables together under section 3 on Attachment A page 1.
  const deliverables = [
    '• Engagement setup summary',
    '• Preliminary findings memo or executive summary',
    '• Recommended 30–90 day roadmap / next-phase scope outline',
  ];

  attachmentA.drawRectangle({
    x: 28,
    y: 34,
    width: 560,
    height: 58,
    color: WHITE,
    borderWidth: 0,
  });

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
