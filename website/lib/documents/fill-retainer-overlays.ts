import { rgb } from 'pdf-lib';

export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  key: string | null;
}

type TextAlign = 'left' | 'right';

export interface OverlaySpec {
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

const ERASE_WHITE = rgb(1, 1, 1);
const ERASE_COVER = rgb(0.945, 0.945, 0.965);
const TEXT_COLOR = rgb(0.05, 0.05, 0.05);
const FONT_BODY = 10;
const FONT_COMPACT = 9.5;

const COVER_COL = { x: 483, w: 118 };

export function overlaySpec(
  partial: Omit<OverlaySpec, 'align' | 'padX'> & { align?: TextAlign; padX?: number },
): OverlaySpec {
  return { align: 'left', padX: 2, ...partial };
}

function findKey(items: PdfTextItem[], key: string): PdfTextItem | undefined {
  return items.find((item) => item.key === key);
}

function findKeys(items: PdfTextItem[], key: string): PdfTextItem[] {
  return items.filter((item) => item.key === key);
}

function fullAddress(tokenMap: Record<string, string>): string | null {
  const street = tokenMap['Recipient.StreetAddress']?.trim();
  const city = tokenMap['Recipient.City']?.trim();
  const state = tokenMap['Recipient.State']?.trim();
  const zip = tokenMap['Recipient.PostalCode']?.trim();
  if (!street && !city) return null;
  const cityStateZip = [city, state].filter(Boolean).join(', ').trim();
  const tail = [cityStateZip, zip].filter(Boolean).join(' ').trim();
  return tail ? `${street || ''}, ${tail}`.replace(/^,\s*/, '') : street || null;
}

function bounds(items: PdfTextItem[], pad = 3) {
  if (!items.length) return null;
  const minX = Math.min(...items.map((i) => i.x));
  const maxX = Math.max(...items.map((i) => i.x + i.width));
  const minY = Math.min(...items.map((i) => i.y));
  const maxY = Math.max(...items.map((i) => i.y + i.height));
  // pdf.js y is the text baseline — do not use maxY (top of glyph box) for drawText.
  const textY = Math.max(...items.map((i) => i.y));
  return {
    eraseX: minX - pad,
    eraseY: minY - pad,
    eraseW: maxX - minX + pad * 2,
    eraseH: maxY - minY + pad * 2,
    textY,
  };
}

function sameLineY(a: PdfTextItem, b: PdfTextItem, tolerance = 2): boolean {
  return Math.abs(a.y - b.y) <= tolerance;
}

function adjacentDollar(items: PdfTextItem[], token: PdfTextItem): PdfTextItem | undefined {
  return items.find(
    (item) => item.str === '$' && sameLineY(item, token) && item.x < token.x && token.x - (item.x + item.width) < 8,
  );
}

/** Items on the same text row as anchor (for mixed static + token lines). */
function rowItems(items: PdfTextItem[], anchor: PdfTextItem, tolerance = 2): PdfTextItem[] {
  return items.filter((item) => sameLineY(item, anchor, tolerance));
}

function applyGrouped(
  overlays: OverlaySpec[],
  consumed: Set<PdfTextItem>,
  result: { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null,
) {
  if (!result) return;
  overlays.push(...result.overlays);
  for (const item of result.consumed) consumed.add(item);
}

function overlayFromItems(
  items: PdfTextItem[],
  text: string,
  fontSize = FONT_BODY,
  bgColor = ERASE_WHITE,
  align: TextAlign = 'left',
  pad = 3,
): OverlaySpec | null {
  const box = bounds(items, pad);
  if (!box) return null;
  return overlaySpec({
    ...box,
    text,
    fontSize,
    bgColor,
    textColor: TEXT_COLOR,
    align,
  });
}

/** Page 1 — Prepared for: single clean name. */
export function tryBuildRetainerCoverPreparedForOverlay(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null {
  if (pageNum !== 1) return null;

  const first =
    findKey(items, 'Customer.FirstName') ??
    findKey(items, 'Recipient.FirstName') ??
    findKey(items, 'Client.FirstName');
  const last =
    findKey(items, 'Customer.LastName') ??
    findKey(items, 'Recipient.LastName') ??
    findKey(items, 'Client.LastName');
  const fullName = tokenMap['Recipient.FullName']?.trim();
  if (!first || !last || !fullName) return null;

  const consumed = new Set<PdfTextItem>([first, last]);
  const minY = Math.min(first.y, last.y);
  const maxY = Math.max(first.y, last.y);
  const top = first.y >= last.y ? first : last;

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX: Math.min(first.x, last.x) - 4,
        eraseY: minY - 3,
        eraseW: COVER_COL.x + COVER_COL.w - Math.min(first.x, last.x) + 6,
        eraseH: maxY - minY + top.height + 6,
        text: fullName,
        textY: top.y,
        fontSize: FONT_COMPACT,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
        align: 'right',
        padX: 3,
      }),
    ],
  };
}

/** Page 2 — Customer / Contractor intro (token rows only, preserve intro sentence above). */
export function tryBuildRetainerPage2CustomerOverlay(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null {
  if (pageNum !== 2) return null;

  const company = findKey(items, 'Client.Company');
  const street = findKey(items, 'Client.StreetAddress');
  const city = findKey(items, 'Client.City');
  const state = findKey(items, 'Client.State');
  const zip = findKey(items, 'Client.PostalCode');
  if (!company || (!street && !city)) return null;

  const address = fullAddress(tokenMap);
  const companyName = tokenMap['Recipient.Company'] || tokenMap['Client.Company'] || '';
  if (!address || !companyName) return null;

  const consumed = new Set<PdfTextItem>();
  const partyRows = new Set<number>();

  for (const anchor of [company, street, city, state, zip].filter(Boolean) as PdfTextItem[]) {
    partyRows.add(Math.round(anchor.y));
  }

  const partyItems: PdfTextItem[] = [];
  for (const item of items) {
    const onPartyRow = [...partyRows].some((y) => Math.abs(item.y - y) <= 2);
    const isContractorRow = item.y >= 598 && item.y <= 628 && item.x <= 560;
    if (
      item.key?.startsWith('Client.') ||
      (onPartyRow && item.x <= 560) ||
      isContractorRow
    ) {
      partyItems.push(item);
      consumed.add(item);
    }
  }

  const line1 = `Customer: ${companyName}, with its principal place of business at ${address} ("Customer"); and`;
  const line2 =
    'Contractor: Michael Hart Consulting Group LLC, a Georgia limited liability company, with its principal place of business at 246 Round Pond Drive, Lilburn, GA 30047 ("Contractor").';

  const box = bounds(partyItems, 4);
  if (!box) return null;

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX: 35,
        eraseY: box.eraseY,
        eraseW: 542,
        eraseH: box.eraseY + box.eraseH - box.eraseY,
        text: `${line1}\n${line2}`,
        textY: box.textY,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    ],
  };
}

/** Page 11 — To Customer block (token rows only; keep "To Customer:" label). */
export function tryBuildRetainerNoticesAddressOverlay(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null {
  if (pageNum !== 11) return null;

  const company = findKey(items, 'Client.Company');
  const street = findKey(items, 'Client.StreetAddress');
  const city = findKey(items, 'Client.City');
  const state = findKey(items, 'Client.State');
  const zip = findKey(items, 'Client.PostalCode');
  const email = findKey(items, 'Client.Email');
  if (!company || !street) return null;

  const address = fullAddress(tokenMap);
  const companyName = tokenMap['Recipient.Company'] || tokenMap['Client.Company'] || '';
  const clientEmail = tokenMap['Recipient.Email'] || tokenMap['Client.Email'] || '';
  if (!address || !companyName) return null;

  const consumed = new Set<PdfTextItem>();
  const overlays: OverlaySpec[] = [];

  const companyRow = rowItems(items, company);
  for (const item of companyRow) {
    if (item.key?.startsWith('Client.') || item.x < 65) {
      consumed.add(item);
    }
  }
  const companyOnly = companyRow.filter((i) => consumed.has(i));
  const companyOverlay = overlayFromItems(companyOnly.length ? companyOnly : [company], companyName);
  if (companyOverlay) overlays.push(companyOverlay);

  const streetRow = rowItems(items, street);
  for (const item of streetRow) consumed.add(item);
  const addressOverlay = overlayFromItems(streetRow, address);
  if (addressOverlay) overlays.push(addressOverlay);

  if (email) {
    const emailLabel = items.find((i) => i.str === 'Email:' && sameLineY(i, email));
    if (emailLabel) consumed.add(emailLabel);
    consumed.add(email);
    const emailItems = emailLabel ? [emailLabel, email] : [email];
    const emailOverlay = overlayFromItems(emailItems, `Email: ${clientEmail}`);
    if (emailOverlay) overlays.push(emailOverlay);
  }

  for (const item of [city, state, zip]) {
    if (item) consumed.add(item);
  }

  if (!overlays.length) return null;
  return { overlays, consumed };
}

/** Page 12 — Replace token fields only (preserve CONTRACTOR/CUSTOMER labels and sign graphics). */
export function tryBuildRetainerSignatureOverlays(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null {
  if (pageNum !== 12) return null;

  const overlays: OverlaySpec[] = [];
  const consumed = new Set<PdfTextItem>();
  const fullName = tokenMap['Recipient.FullName']?.trim();
  const ownerFullName = tokenMap['Owner.FullName']?.trim();
  const companyName = tokenMap['Recipient.Company']?.trim();

  const custCompany = findKey(items, 'Client.Company');
  if (custCompany && companyName) {
    const o = overlayFromItems([custCompany], companyName);
    if (o) overlays.push(o);
    consumed.add(custCompany);
  }

  const nameFirst = findKey(items, 'Client.FirstName');
  const nameLast = findKey(items, 'Client.LastName');
  if (nameFirst && nameLast && fullName) {
    const o = overlayFromItems([nameFirst, nameLast], fullName);
    if (o) overlays.push(o);
    consumed.add(nameFirst);
    consumed.add(nameLast);
  }

  const contractorFirst = findKey(items, 'Contractor.FirstName');
  const contractorLast = findKey(items, 'Contractor.LastName');
  if (contractorFirst && contractorLast && ownerFullName) {
    const o = overlayFromItems([contractorFirst, contractorLast], ownerFullName);
    if (o) overlays.push(o);
    consumed.add(contractorFirst);
    consumed.add(contractorLast);
  }

  const signFirst = findKey(items, 'Customer.FirstName');
  const signLast = findKey(items, 'Customer.LastName');
  if (signFirst && signLast && fullName) {
    const o = overlayFromItems([signFirst, signLast], fullName);
    if (o) overlays.push(o);
    consumed.add(signFirst);
    consumed.add(signLast);
  }

  if (!overlays.length) return null;
  return { overlays, consumed };
}

/** Page 14 — Invoicing address token row only. */
export function tryBuildRetainerInvoicingAddressOverlay(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null {
  if (pageNum !== 14) return null;

  const street = findKey(items, 'Client.StreetAddress');
  if (!street) return null;

  const city = findKey(items, 'Client.City');
  const state = findKey(items, 'Client.State');
  const zip = findKey(items, 'Client.PostalCode');
  const address = fullAddress(tokenMap);
  if (!address) return null;

  const row = rowItems(items, street);
  const consumed = new Set(row);
  const o = overlayFromItems(row, address);
  if (!o) return null;

  return { consumed, overlays: [o] };
}

/** Page 14 — Fee token rows only (keep section 8 heading and static labels). */
export function tryBuildRetainerActivationFeeOverlay(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null {
  if (pageNum !== 14) return null;

  const total = findKey(items, 'TOTAL PHASE 1 FEE');
  const retainer = findKey(items, 'RETAINER AMOUNT');
  const balance = findKey(items, 'BALANCE DUE') ?? findKey(items, 'BALANCE DUE AT DELIVERY');
  const credited = findKey(items, 'ACTIVATION CREDITED');
  if (!total && !retainer) return null;

  const totalFee = tokenMap['TOTAL PHASE 1 FEE']?.trim();
  const retainerAmt = tokenMap['RETAINER AMOUNT']?.trim();
  const balanceDue = tokenMap['BALANCE DUE']?.trim() || tokenMap['BALANCE DUE AT DELIVERY']?.trim();
  const creditedPct = tokenMap['ACTIVATION CREDITED']?.trim() || '38%';
  if (!totalFee || !retainerAmt || !balanceDue) return null;

  const consumed = new Set<PdfTextItem>();
  const overlays: OverlaySpec[] = [];

  if (total) {
    const dollar = adjacentDollar(items, total);
    if (dollar) consumed.add(dollar);
    consumed.add(total);
    const o = overlayFromItems(dollar ? [dollar, total] : [total], `$${totalFee}`, FONT_BODY, ERASE_WHITE, 'left', 1);
    if (o) overlays.push(o);
  }

  if (retainer) {
    const dollar = adjacentDollar(items, retainer);
    if (dollar) consumed.add(dollar);
    consumed.add(retainer);
    const o = overlayFromItems(dollar ? [dollar, retainer] : [retainer], `$${retainerAmt}`, FONT_BODY, ERASE_WHITE, 'left', 1);
    if (o) overlays.push(o);
  }

  if (credited) {
    consumed.add(credited);
    const pct = creditedPct.replace(/%$/, '');
    const o = overlayFromItems([credited], `${pct}%`, FONT_BODY, ERASE_WHITE, 'left', 0);
    if (o) overlays.push(o);
  }

  if (balance) {
    const dollar = adjacentDollar(items, balance);
    if (dollar) consumed.add(dollar);
    consumed.add(balance);
    const o = overlayFromItems(dollar ? [dollar, balance] : [balance], `$${balanceDue}`, FONT_BODY, ERASE_WHITE, 'left', 1);
    if (o) overlays.push(o);
  }

  if (!overlays.length) return null;
  return { overlays, consumed };
}

/** Page 13 — Client.Company + PROPOSAL DATE tokens only. */
export function tryBuildRetainerAttachmentOverlays(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null {
  if (pageNum !== 13) return null;

  const overlays: OverlaySpec[] = [];
  const consumed = new Set<PdfTextItem>();
  const companyName = tokenMap['Recipient.Company'] || tokenMap['Client.Company'] || '';
  const proposalDate = tokenMap['PROPOSAL DATE']?.trim() || tokenMap['Date']?.trim();

  const sowCompany = findKey(items, 'Client.Company');
  if (sowCompany && companyName) {
    const row = rowItems(items, sowCompany);
    for (const item of row) {
      if (item.key?.startsWith('Client.') || item.str.includes('Customer') || item.str.includes('Contractor')) {
        consumed.add(item);
      }
    }
    const o = overlayFromItems([sowCompany], companyName);
    if (o) overlays.push(o);
    consumed.add(sowCompany);
  }

  const proposalToken = findKey(items, 'PROPOSAL DATE');
  if (proposalToken && proposalDate) {
    consumed.add(proposalToken);
    const o = overlayFromItems([proposalToken], proposalDate, FONT_BODY, ERASE_WHITE, 'left', 1);
    if (o) overlays.push(o);
  }

  if (!overlays.length) return null;
  return { overlays, consumed };
}

/** Retainer-only grouped overlays — NDA path unchanged. */
export function buildRetainerGroupedOverlays(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } {
  const overlays: OverlaySpec[] = [];
  const consumed = new Set<PdfTextItem>();

  applyGrouped(overlays, consumed, tryBuildRetainerCoverPreparedForOverlay(pageNum, items, tokenMap));
  applyGrouped(overlays, consumed, tryBuildRetainerPage2CustomerOverlay(pageNum, items, tokenMap));
  applyGrouped(overlays, consumed, tryBuildRetainerNoticesAddressOverlay(pageNum, items, tokenMap));
  applyGrouped(overlays, consumed, tryBuildRetainerSignatureOverlays(pageNum, items, tokenMap));
  applyGrouped(overlays, consumed, tryBuildRetainerAttachmentOverlays(pageNum, items, tokenMap));
  applyGrouped(overlays, consumed, tryBuildRetainerInvoicingAddressOverlay(pageNum, items, tokenMap));
  applyGrouped(overlays, consumed, tryBuildRetainerActivationFeeOverlay(pageNum, items, tokenMap));

  return { overlays, consumed };
}
