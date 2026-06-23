import { ensurePdfJsNodeEnvironment } from '@/lib/documents/pdfjs-node-setup';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/** Replace PandaDoc-style bracket / brace tokens inside a PDF byte stream. */
export function buildPdfTokenReplacements(tokenMap: Record<string, string>): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(tokenMap)) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    pairs.push([`[${key}]`, trimmed]);
    pairs.push([`{{${key}}}`, trimmed]);
  }
  pairs.sort((a, b) => b[0].length - a[0].length);
  return pairs;
}

function tokenKeyFromPlaceholder(text: string): string | null {
  const bracket = text.match(/^\[(.+)\]$/);
  if (bracket) return bracket[1];
  const braces = text.match(/^\{\{(.+)\}\}$/);
  if (braces) return braces[1];
  return null;
}

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.52;
}

/**
 * PandaDoc PDFs store merge tokens in compressed font streams (not plain ASCII),
 * so string replace on raw bytes does nothing. Overlay real text at each token bbox.
 */
export async function fillPdfTokenBuffer(
  pdf: Buffer,
  tokenMap: Record<string, string>,
): Promise<Buffer> {
  await ensurePdfJsNodeEnvironment();
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(pdf);
  const pdfjsDoc = await pdfjs.getDocument({ data, disableFontFace: true }).promise;
  const pdfDoc = await PDFDocument.load(pdf);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (let pageNum = 1; pageNum <= pdfjsDoc.numPages; pageNum++) {
    const pdfjsPage = await pdfjsDoc.getPage(pageNum);
    const pdfLibPage = pages[pageNum - 1];
    const textContent = await pdfjsPage.getTextContent();

    for (const item of textContent.items) {
      if (!('str' in item) || typeof item.str !== 'string') continue;
      const key = tokenKeyFromPlaceholder(item.str.trim());
      if (!key) continue;

      const value = tokenMap[key]?.trim();
      if (!value) continue;

      const fontSize = Math.max(8, Math.min(12, (item.height || 11) * 0.95));
      const x = item.transform[4];
      const y = item.transform[5];
      const boxWidth = Math.max(item.width || 0, estimateTextWidth(value, fontSize)) + 4;
      const boxHeight = (item.height || fontSize) + 3;

      pdfLibPage.drawRectangle({
        x: x - 1,
        y: y - 2,
        width: boxWidth,
        height: boxHeight,
        color: rgb(1, 1, 1),
        borderWidth: 0,
      });

      pdfLibPage.drawText(value, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
    }
  }

  return Buffer.from(await pdfDoc.save());
}
