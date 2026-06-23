import { ensurePdfJsNodeEnvironment } from '@/lib/documents/pdfjs-node-setup';
import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib';

const TEXT_COLOR = rgb(0.07, 0.07, 0.07);
const DATE_TEXT_COLOR = rgb(1, 1, 1);
const ERASE_WHITE = rgb(1, 1, 1);
const ERASE_COVER = rgb(0.945, 0.945, 0.965);
const ERASE_DATE_PILL = rgb(0.12, 0.45, 0.38);

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  key: string | null;
}

interface OverlaySpec {
  eraseX: number;
  eraseY: number;
  eraseW: number;
  eraseH: number;
  text: string;
  textX: number;
  textY: number;
  fontSize: number;
  bgColor: ReturnType<typeof rgb>;
  textColor: ReturnType<typeof rgb>;
}

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

function parseItems(textContent: { items: unknown[] }): PdfTextItem[] {
  const out: PdfTextItem[] = [];
  for (const raw of textContent.items) {
    if (!raw || typeof raw !== 'object' || !('str' in raw)) continue;
    const item = raw as { str: string; transform: number[]; width?: number; height?: number };
    if (typeof item.str !== 'string') continue;
    out.push({
      str: item.str.trim(),
      x: item.transform[4],
      y: item.transform[5],
      width: item.width || 0,
      height: item.height || 11,
      key: tokenKeyFromPlaceholder(item.str.trim()),
    });
  }
  return out;
}

function fitFontSize(font: PDFFont, text: string, maxWidth: number, preferred: number, min = 6.5): number {
  let size = preferred;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.25;
  }
  return size;
}

function sameLine(a: PdfTextItem, b: PdfTextItem, tolerance = 1.5): boolean {
  return Math.abs(a.y - b.y) <= tolerance;
}

function findKey(items: PdfTextItem[], key: string): PdfTextItem | undefined {
  return items.find((item) => item.key === key);
}

function combineInlineNames(
  first: PdfTextItem,
  last: PdfTextItem,
  fullName: string,
  bgColor: ReturnType<typeof rgb>,
): OverlaySpec {
  const eraseX = first.x - 2;
  const eraseY = first.y - 2;
  const eraseW = last.x + last.width - eraseX + 4;
  const eraseH = first.height + 4;
  const fontSize = Math.max(8, Math.min(11, first.height * 0.92));
  return {
    eraseX,
    eraseY,
    eraseW,
    eraseH,
    text: fullName,
    textX: eraseX + 1,
    textY: first.y,
    fontSize,
    bgColor,
    textColor: TEXT_COLOR,
  };
}

function combineStackedNames(
  first: PdfTextItem,
  last: PdfTextItem,
  fullName: string,
  bgColor: ReturnType<typeof rgb>,
): OverlaySpec {
  const top = first.y >= last.y ? first : last;
  const bottom = first.y >= last.y ? last : first;
  const eraseX = Math.min(first.x, last.x) - 2;
  const eraseY = bottom.y - 2;
  const eraseW = Math.max(first.x + first.width, last.x + last.width) - eraseX + 4;
  const eraseH = top.y - bottom.y + top.height + 4;
  const fontSize = Math.max(8, Math.min(10.5, top.height * 0.92));
  return {
    eraseX,
    eraseY,
    eraseW,
    eraseH,
    text: fullName,
    textX: eraseX + 1,
    textY: top.y,
    fontSize,
    bgColor,
    textColor: TEXT_COLOR,
  };
}

function buildOverlaysForPage(pageNum: number, items: PdfTextItem[], tokenMap: Record<string, string>): OverlaySpec[] {
  const overlays: OverlaySpec[] = [];
  const consumed = new Set<PdfTextItem>();
  const coverBg = ERASE_COVER;

  const ownerState = findKey(items, 'Owner.State');
  if (ownerState && pageNum === 1) {
    const ofItem = items.find((item) => item.str === 'of' && sameLine(item, ownerState));
    const stateWord = items.find((item) => item.str === 'State' && sameLine(item, ownerState));
    const label = tokenMap['Owner.StateLabel'] || `State: ${tokenMap['Owner.State'] || ''}`;
    const eraseX = (ofItem?.x ?? ownerState.x) - 2;
    const eraseY = ownerState.y - 2;
    const eraseW =
      (stateWord ? stateWord.x + stateWord.width : ownerState.x + ownerState.width) - eraseX + 4;
    overlays.push({
      eraseX,
      eraseY,
      eraseW,
      eraseH: ownerState.height + 4,
      text: label.trim(),
      textX: eraseX + 1,
      textY: ownerState.y,
      fontSize: Math.max(9, ownerState.height * 0.92),
      bgColor: ERASE_WHITE,
      textColor: TEXT_COLOR,
    });
    consumed.add(ownerState);
    if (ofItem) consumed.add(ofItem);
    if (stateWord) consumed.add(stateWord);
  }

  const namePairs: Array<[string, string, string]> = [
    ['Recipient.FirstName', 'Recipient.LastName', 'Recipient.FullName'],
    ['Owner.FirstName', 'Owner.LastName', 'Owner.FullName'],
  ];

  for (const [firstKey, lastKey, fullKey] of namePairs) {
    const first = findKey(items, firstKey);
    const last = findKey(items, lastKey);
    if (!first || !last || consumed.has(first) || consumed.has(last)) continue;

    const fullName = tokenMap[fullKey]?.trim();
    if (!fullName) continue;

    const bg = pageNum === 1 ? coverBg : ERASE_WHITE;
    const overlay = sameLine(first, last)
      ? combineInlineNames(first, last, fullName, bg)
      : combineStackedNames(first, last, fullName, bg);

    overlays.push(overlay);
    consumed.add(first);
    consumed.add(last);
  }

  for (const item of items) {
    if (consumed.has(item) || !item.key) continue;

    const rawValue = tokenMap[item.key]?.trim();
    if (!rawValue) continue;

    let text = rawValue;
    let textX = item.x;
    let textY = item.y;
    let eraseX = item.x - 2;
    let eraseY = item.y - 2;
    let eraseW = item.width + 4;
    let eraseH = item.height + 4;
    let fontSize = Math.max(8, Math.min(11, item.height * 0.92));
    let bgColor = pageNum === 1 && item.x > 400 ? coverBg : ERASE_WHITE;
    let textColor = TEXT_COLOR;

    if (item.key === 'Owner.State') {
      text = tokenMap['Owner.State'] || rawValue;
      fontSize = Math.max(8, item.height * 0.92);
    } else if (item.key === 'Date') {
      textX = item.x - 22;
      eraseX = textX - 2;
      eraseW = Math.max(item.width + 26, 118);
      fontSize = Math.max(7.5, Math.min(9.5, item.height * 0.88));
      bgColor = ERASE_DATE_PILL;
      textColor = DATE_TEXT_COLOR;
    } else if (item.key === 'Company website') {
      eraseW = Math.max(item.width + 8, 130);
      fontSize = 8.5;
    } else if (item.key === 'Owner.Company' || item.key === 'Recipient.Company') {
      eraseW = Math.max(item.width + 6, item.width);
    } else if (item.key === 'Document.CreatedDate') {
      eraseW = Math.max(item.width + 4, 120);
    }

    overlays.push({
      eraseX,
      eraseY,
      eraseW,
      eraseH,
      text,
      textX,
      textY,
      fontSize,
      bgColor,
      textColor,
    });
    consumed.add(item);
  }

  return overlays;
}

/**
 * PandaDoc PDFs store merge tokens in compressed font streams (not plain ASCII).
 * Overlay grouped, fitted text at each token region.
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
    const items = parseItems(await pdfjsPage.getTextContent());
    const overlays = buildOverlaysForPage(pageNum, items, tokenMap);

    for (const overlay of overlays) {
      pdfLibPage.drawRectangle({
        x: overlay.eraseX,
        y: overlay.eraseY,
        width: overlay.eraseW,
        height: overlay.eraseH,
        color: overlay.bgColor,
        borderWidth: 0,
      });

      const fontSize = fitFontSize(font, overlay.text, overlay.eraseW - 4, overlay.fontSize, 6);

      pdfLibPage.drawText(overlay.text, {
        x: overlay.textX,
        y: overlay.textY,
        size: fontSize,
        font,
        color: overlay.textColor,
      });
    }
  }

  return Buffer.from(await pdfDoc.save());
}
