import { ensurePdfJsNodeEnvironment } from '@/lib/documents/pdfjs-node-setup';
import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib';

/** Universal overlay typography — Helvetica at fixed sizes for every filled field. */
const FONT_BODY = 10;
const FONT_COMPACT = 9.5;
const FONT_FOOTER = 8.5;
const FONT_DATE_PILL = 9;
const FONT_MIN = 7;

const TEXT_COLOR = rgb(0.05, 0.05, 0.05);
const DATE_TEXT_COLOR = rgb(1, 1, 1);
const ERASE_WHITE = rgb(1, 1, 1);
const ERASE_COVER = rgb(0.945, 0.945, 0.965);
const ERASE_DATE_PILL = rgb(0.12, 0.45, 0.38);

/** Cover page right column — uniform box width and x for Prepared for / Created by. */
const COVER_COL = { x: 483, w: 118 };

/** Signature page company columns — equal width so font size matches. */
const SIG_LEFT = { x: 35, w: 248 };
const SIG_RIGHT = { x: 312, w: 248 };

/** Footer website — right-aligned within page margin. */
const FOOTER_WEB = { x: 468, w: 142 };

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  key: string | null;
}

type TextAlign = 'left' | 'right';

interface OverlaySpec {
  eraseX: number;
  eraseY: number;
  eraseW: number;
  eraseH: number;
  text: string;
  textY: number;
  fontSize: number;
  bgColor: ReturnType<typeof rgb>;
  textColor: ReturnType<typeof rgb>;
  align: TextAlign;
  padX: number;
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

function baseFontSize(item: PdfTextItem): number {
  return item.height >= 11.5 ? FONT_BODY : FONT_COMPACT;
}

function fitFontSize(font: PDFFont, text: string, maxWidth: number, preferred: number, min = FONT_MIN): number {
  let size = preferred;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.25;
  }
  return size;
}

function textXForAlign(
  font: PDFFont,
  text: string,
  fontSize: number,
  eraseX: number,
  eraseW: number,
  align: TextAlign,
  padX: number,
): number {
  const textW = font.widthOfTextAtSize(text, fontSize);
  if (align === 'right') return eraseX + eraseW - textW - padX;
  return eraseX + padX;
}

function sameLine(a: PdfTextItem, b: PdfTextItem, tolerance = 1.5): boolean {
  return Math.abs(a.y - b.y) <= tolerance;
}

function findKey(items: PdfTextItem[], key: string): PdfTextItem | undefined {
  return items.find((item) => item.key === key);
}

function overlaySpec(
  partial: Omit<OverlaySpec, 'align' | 'padX'> & { align?: TextAlign; padX?: number },
): OverlaySpec {
  return { align: 'left', padX: 2, ...partial };
}

function combineInlineNames(
  first: PdfTextItem,
  last: PdfTextItem,
  fullName: string,
  bgColor: ReturnType<typeof rgb>,
  opts?: { eraseX?: number; eraseW?: number; align?: TextAlign; fontSize?: number },
): OverlaySpec {
  const eraseX = opts?.eraseX ?? first.x - 2;
  const eraseW = opts?.eraseW ?? last.x + last.width - eraseX + 4;
  const eraseY = first.y - 2;
  const eraseH = first.height + 4;
  return overlaySpec({
    eraseX,
    eraseY,
    eraseW,
    eraseH,
    text: fullName,
    textY: first.y,
    fontSize: opts?.fontSize ?? baseFontSize(first),
    bgColor,
    textColor: TEXT_COLOR,
    align: opts?.align ?? 'left',
    padX: 2,
  });
}

function combineStackedNames(
  first: PdfTextItem,
  last: PdfTextItem,
  fullName: string,
  bgColor: ReturnType<typeof rgb>,
  opts?: { eraseX?: number; eraseW?: number; align?: TextAlign },
): OverlaySpec {
  const top = first.y >= last.y ? first : last;
  const bottom = first.y >= last.y ? last : first;
  const eraseX = opts?.eraseX ?? Math.min(first.x, last.x) - 2;
  const eraseY = bottom.y - 2;
  const eraseW = opts?.eraseW ?? Math.max(first.x + first.width, last.x + last.width) - eraseX + 4;
  const eraseH = top.y - bottom.y + top.height + 4;
  return overlaySpec({
    eraseX,
    eraseY,
    eraseW,
    eraseH,
    text: fullName,
    textY: top.y,
    fontSize: baseFontSize(top),
    bgColor,
    textColor: TEXT_COLOR,
    align: opts?.align ?? 'left',
    padX: 2,
  });
}

/**
 * Page 2 intro: PandaDoc splits date / between / names across wide token boxes.
 * Replace with two natural lines instead of per-token white boxes.
 */
function tryBuildPage2IntroOverlays(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null {
  if (pageNum !== 2) return null;

  const dateItem = findKey(items, 'Document.CreatedDate') ?? findKey(items, 'Date');
  const ownerFirst = findKey(items, 'Owner.FirstName');
  const ownerLast = findKey(items, 'Owner.LastName');
  const recipientFirst = findKey(items, 'Recipient.FirstName');
  const recipientLast = findKey(items, 'Recipient.LastName');
  if (!dateItem || !ownerFirst || !ownerLast || !recipientFirst || !recipientLast) return null;

  const date = (tokenMap['Document.CreatedDate'] || tokenMap['Date'] || '').trim();
  const ownerFull = (tokenMap['Owner.FullName'] || `${tokenMap['Owner.FirstName'] || ''} ${tokenMap['Owner.LastName'] || ''}`).trim();
  const recipientFull = (
    tokenMap['Recipient.FullName'] ||
    `${tokenMap['Recipient.FirstName'] || ''} ${tokenMap['Recipient.LastName'] || ''}`
  ).trim();
  if (!date || !ownerFull || !recipientFull) return null;

  const betweenItem = items.find((item) => item.str === 'between' && sameLine(item, dateItem));
  const ownerAndItem = items.find((item) => item.str === '(Owner) and' && sameLine(item, ownerFirst));
  const recipientLabel = items.find((item) => item.str.startsWith('(Recipient)'));

  const consumed = new Set<PdfTextItem>([
    dateItem,
    ownerFirst,
    ownerLast,
    recipientFirst,
    recipientLast,
  ]);
  if (betweenItem) consumed.add(betweenItem);
  if (ownerAndItem) consumed.add(ownerAndItem);
  if (recipientLabel) consumed.add(recipientLabel);

  const dateLineEnd = betweenItem ? betweenItem.x + betweenItem.width : dateItem.x + dateItem.width;
  const partiesLineBottom = recipientLabel?.y ?? ownerFirst.y;

  const overlays: OverlaySpec[] = [
    overlaySpec({
      eraseX: dateItem.x - 2,
      eraseY: dateItem.y - 2,
      eraseW: dateLineEnd - dateItem.x + 6,
      eraseH: dateItem.height + 4,
      text: `${date} between`,
      textY: dateItem.y,
      fontSize: FONT_BODY,
      bgColor: ERASE_WHITE,
      textColor: TEXT_COLOR,
    }),
    overlaySpec({
      eraseX: ownerFirst.x - 2,
      eraseY: partiesLineBottom - 2,
      eraseW:
        Math.max(
          recipientLast.x + recipientLast.width,
          (recipientLabel?.x ?? 0) + (recipientLabel?.width ?? 0),
        ) -
        ownerFirst.x +
        6,
      eraseH: ownerFirst.y - partiesLineBottom + ownerFirst.height + 4,
      text: `${ownerFull} (Owner) and ${recipientFull} (Recipient).`,
      textY: ownerFirst.y,
      fontSize: FONT_BODY,
      bgColor: ERASE_WHITE,
      textColor: TEXT_COLOR,
    }),
  ];

  return { overlays, consumed };
}

function buildOverlaysForPage(pageNum: number, items: PdfTextItem[], tokenMap: Record<string, string>): OverlaySpec[] {
  const overlays: OverlaySpec[] = [];
  const consumed = new Set<PdfTextItem>();
  const coverBg = ERASE_COVER;

  const intro = tryBuildPage2IntroOverlays(pageNum, items, tokenMap);
  if (intro) {
    overlays.push(...intro.overlays);
    for (const item of intro.consumed) consumed.add(item);
  }

  const ownerState = findKey(items, 'Owner.State');
  if (ownerState && pageNum === 1) {
    const ofItem = items.find((item) => item.str === 'of' && sameLine(item, ownerState));
    const stateWord = items.find((item) => item.str === 'State' && sameLine(item, ownerState));
    const label = tokenMap['Owner.StateLabel'] || `State: ${tokenMap['Owner.State'] || ''}`;
    const eraseX = (ofItem?.x ?? ownerState.x) - 2;
    const eraseY = ownerState.y - 2;
    const eraseW =
      (stateWord ? stateWord.x + stateWord.width : ownerState.x + ownerState.width) - eraseX + 4;
    overlays.push(
      overlaySpec({
        eraseX,
        eraseY,
        eraseW,
        eraseH: ownerState.height + 4,
        text: label.trim(),
        textY: ownerState.y,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    );
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

    const onCover = pageNum === 1;
    const bg = onCover ? coverBg : ERASE_WHITE;
    const coverOpts = onCover
      ? { eraseX: COVER_COL.x, eraseW: COVER_COL.w, align: 'right' as TextAlign }
      : undefined;

    const overlay = sameLine(first, last)
      ? combineInlineNames(first, last, fullName, bg, coverOpts)
      : combineStackedNames(first, last, fullName, bg, coverOpts);

    overlays.push(overlay);
    consumed.add(first);
    consumed.add(last);
  }

  for (const item of items) {
    if (consumed.has(item) || !item.key) continue;

    const rawValue = tokenMap[item.key]?.trim();
    if (!rawValue) continue;

    let text = rawValue;
    let eraseX = item.x - 2;
    let eraseY = item.y - 2;
    let eraseW = item.width + 4;
    let eraseH = item.height + 4;
    let textY = item.y;
    let fontSize = baseFontSize(item);
    let bgColor = pageNum === 1 && item.x > 400 ? coverBg : ERASE_WHITE;
    let textColor = TEXT_COLOR;
    let align: TextAlign = 'left';
    let padX = 2;

    if (item.key === 'Owner.State') {
      text = tokenMap['Owner.State'] || rawValue;
      fontSize = FONT_BODY;
    } else if (item.key === 'Date' && pageNum === 1) {
      eraseX = 488;
      eraseY = item.y - 3;
      eraseW = 128;
      eraseH = item.height + 6;
      textY = item.y - 0.5;
      fontSize = FONT_DATE_PILL;
      bgColor = ERASE_DATE_PILL;
      textColor = DATE_TEXT_COLOR;
      align = 'right';
      padX = 6;
    } else if (item.key === 'Company website') {
      eraseX = FOOTER_WEB.x;
      eraseY = item.y - 2;
      eraseW = FOOTER_WEB.w;
      eraseH = item.height + 4;
      fontSize = FONT_FOOTER;
      align = 'right';
      padX = 2;
    } else if (item.key === 'Document.CreatedDate') {
      eraseW = Math.max(item.width + 2, 118);
      fontSize = FONT_BODY;
    } else if (item.key === 'Owner.Company' || item.key === 'Recipient.Company') {
      if (pageNum === 1) {
        eraseX = COVER_COL.x;
        eraseW = COVER_COL.w;
        bgColor = coverBg;
        align = 'right';
        padX = 3;
        fontSize = FONT_COMPACT;
      } else if (pageNum === 5) {
        const col = item.key === 'Recipient.Company' ? SIG_LEFT : SIG_RIGHT;
        eraseX = col.x;
        eraseW = col.w;
        textY = item.y;
        fontSize = FONT_COMPACT;
        align = 'left';
        padX = 2;
      } else {
        eraseW = Math.max(item.width + 8, 160);
        fontSize = FONT_COMPACT;
      }
    } else if (pageNum === 1 && item.x > 400) {
      eraseX = COVER_COL.x;
      eraseW = COVER_COL.w;
      bgColor = coverBg;
      align = 'right';
      padX = 3;
    }

    overlays.push(
      overlaySpec({
        eraseX,
        eraseY,
        eraseW,
        eraseH,
        text,
        textY,
        fontSize,
        bgColor,
        textColor,
        align,
        padX,
      }),
    );
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

      const fontSize = fitFontSize(font, overlay.text, overlay.eraseW - overlay.padX * 2, overlay.fontSize, FONT_MIN);
      const textX = textXForAlign(
        font,
        overlay.text,
        fontSize,
        overlay.eraseX,
        overlay.eraseW,
        overlay.align,
        overlay.padX,
      );

      pdfLibPage.drawText(overlay.text, {
        x: textX,
        y: overlay.textY,
        size: fontSize,
        font,
        color: overlay.textColor,
      });
    }
  }

  return Buffer.from(await pdfDoc.save());
}
