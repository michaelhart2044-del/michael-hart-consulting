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

/** Cover page right column — matches fill-pdf-tokens.ts */
const COVER_COL = { x: 483, w: 118 };

/** Signature columns — matches fill-pdf-tokens.ts */
const SIG_LEFT = { x: 35, w: 248 };
const SIG_RIGHT = { x: 312, w: 248 };

export function overlaySpec(
  partial: Omit<OverlaySpec, 'align' | 'padX'> & { align?: TextAlign; padX?: number },
): OverlaySpec {
  return { align: 'left', padX: 2, ...partial };
}

function findKey(items: PdfTextItem[], key: string): PdfTextItem | undefined {
  return items.find((item) => item.key === key);
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

function applyGrouped(
  overlays: OverlaySpec[],
  consumed: Set<PdfTextItem>,
  result: { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null,
) {
  if (!result) return;
  overlays.push(...result.overlays);
  for (const item of result.consumed) consumed.add(item);
}

/** Page 1 — Prepared for: single clean name (no [Customer.*] token gaps). */
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
  const top = first.y >= last.y ? first : last;
  const bottom = first.y >= last.y ? last : first;

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX: COVER_COL.x - 6,
        eraseY: bottom.y - 4,
        eraseW: COVER_COL.w + 12,
        eraseH: top.y - bottom.y + top.height + 8,
        text: fullName,
        textY: top.y,
        fontSize: FONT_COMPACT,
        bgColor: ERASE_COVER,
        textColor: TEXT_COLOR,
        align: 'right',
        padX: 3,
      }),
    ],
  };
}

/** Page 2 — Customer intro with combined address (no wide token gaps). */
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
  for (const item of [company, street, city, state, zip]) {
    if (item) consumed.add(item);
  }

  const line1 = `Customer: ${companyName}, with its principal place of business at ${address} ("Customer"); and`;
  const line2 =
    'Contractor: Michael Hart Consulting Group LLC, a Georgia limited liability company, with its principal place of business at 246 Round Pond Drive, Lilburn, GA 30047 ("Contractor").';

  const anchorItems = [company, street, city, state, zip].filter(Boolean) as PdfTextItem[];
  const minY = Math.min(...anchorItems.map((item) => item.y));
  const maxY = Math.max(...anchorItems.map((item) => item.y + item.height));

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX: 35,
        eraseY: minY - 6,
        eraseW: 542,
        eraseH: maxY - minY + 20,
        text: `${line1}\n${line2}`,
        textY: maxY - 4,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    ],
  };
}

/** Page 11 — Notices customer block. */
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

  const consumed = new Set<PdfTextItem>([company, street]);
  if (city) consumed.add(city);
  if (state) consumed.add(state);
  if (zip) consumed.add(zip);
  if (email) consumed.add(email);
  for (const item of items) {
    if (item.str === ',' && item.y === street.y) consumed.add(item);
  }

  const topY = company.y;
  const bottomY = email?.y ?? street.y;
  const eraseY = bottomY - 4;
  const eraseH = topY - bottomY + company.height + 8;

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX: 68,
        eraseY,
        eraseW: 480,
        eraseH,
        text: `${companyName}\n${address}\nEmail: ${clientEmail}`,
        textY: topY,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    ],
  };
}

/** Page 12 — Customer block + signature name row (uniform Helvetica). */
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
    overlays.push(
      overlaySpec({
        eraseX: custCompany.x - 2,
        eraseY: custCompany.y - 2,
        eraseW: 280,
        eraseH: custCompany.height + 4,
        text: companyName,
        textY: custCompany.y,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    );
    consumed.add(custCompany);
  }

  const nameFirst = findKey(items, 'Client.FirstName');
  const nameLast = findKey(items, 'Client.LastName');
  if (nameFirst && nameLast && fullName) {
    overlays.push(
      overlaySpec({
        eraseX: nameFirst.x - 2,
        eraseY: nameFirst.y - 2,
        eraseW: nameLast.x + nameLast.width - nameFirst.x + 4,
        eraseH: nameFirst.height + 4,
        text: fullName,
        textY: nameFirst.y,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    );
    consumed.add(nameFirst);
    consumed.add(nameLast);
  }

  const contractorFirst = findKey(items, 'Contractor.FirstName');
  const contractorLast = findKey(items, 'Contractor.LastName');
  if (contractorFirst && contractorLast && ownerFullName) {
    overlays.push(
      overlaySpec({
        eraseX: SIG_LEFT.x,
        eraseY: contractorFirst.y - 2,
        eraseW: SIG_LEFT.w,
        eraseH: contractorFirst.height + 4,
        text: ownerFullName,
        textY: contractorFirst.y,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    );
    consumed.add(contractorFirst);
    consumed.add(contractorLast);
  }

  const signFirst = findKey(items, 'Customer.FirstName');
  const signLast = findKey(items, 'Customer.LastName');
  if (signFirst && signLast && fullName) {
    overlays.push(
      overlaySpec({
        eraseX: SIG_RIGHT.x,
        eraseY: signFirst.y - 2,
        eraseW: SIG_RIGHT.w,
        eraseH: signFirst.height + 4,
        text: fullName,
        textY: signFirst.y,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    );
    consumed.add(signFirst);
    consumed.add(signLast);
  }

  if (!overlays.length) return null;
  return { overlays, consumed };
}

/** Page 14 — Invoicing address. */
export function tryBuildRetainerInvoicingAddressOverlay(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null {
  if (pageNum !== 14) return null;

  const street = findKey(items, 'Client.StreetAddress');
  const city = findKey(items, 'Client.City');
  const state = findKey(items, 'Client.State');
  const zip = findKey(items, 'Client.PostalCode');
  if (!street) return null;

  const address = fullAddress(tokenMap);
  if (!address) return null;

  const consumed = new Set<PdfTextItem>([street]);
  if (city) consumed.add(city);
  if (state) consumed.add(state);
  if (zip) consumed.add(zip);

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX: street.x - 2,
        eraseY: street.y - 2,
        eraseW: 480,
        eraseH: street.height + 4,
        text: address,
        textY: street.y,
        fontSize: 10,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    ],
  };
}

/** Page 14 — Activation retainer fee block (no wide token gaps). */
export function tryBuildRetainerActivationFeeOverlay(
  pageNum: number,
  items: PdfTextItem[],
  tokenMap: Record<string, string>,
): { overlays: OverlaySpec[]; consumed: Set<PdfTextItem> } | null {
  if (pageNum !== 14) return null;

  const total = findKey(items, 'TOTAL PHASE 1 FEE');
  const retainer = findKey(items, 'RETAINER AMOUNT');
  const balance = findKey(items, 'BALANCE DUE') ?? findKey(items, 'BALANCE DUE AT DELIVERY');
  if (!total && !retainer) return null;

  const totalFee = tokenMap['TOTAL PHASE 1 FEE']?.trim();
  const retainerAmt = tokenMap['RETAINER AMOUNT']?.trim();
  const balanceDue = tokenMap['BALANCE DUE']?.trim() || tokenMap['BALANCE DUE AT DELIVERY']?.trim();
  const credited = tokenMap['ACTIVATION CREDITED']?.trim() || '38%';
  if (!totalFee || !retainerAmt || !balanceDue) return null;

  const consumed = new Set<PdfTextItem>();
  for (const item of [total, retainer, balance]) {
    if (item) consumed.add(item);
  }
  for (const item of items) {
    if (item.key === 'ACTIVATION CREDITED' || item.key === 'PROPOSAL DATE') consumed.add(item);
  }

  const anchor = total ?? retainer!;
  const lines = [
    `Total Phase 1 engagement fee: $${totalFee}`,
    `Activation due at signing: $${retainerAmt} (${credited} credited toward total)`,
    `Balance due at delivery: $${balanceDue}`,
    'Retainer is due upon signing via the payment method in the Agreement.',
    'Additional services beyond this SOW require prior written approval and separate fees.',
  ];

  const bottom = Math.min(...[total, retainer, balance].filter(Boolean).map((i) => i!.y));
  const top = anchor.y + anchor.height + 2;

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX: 35,
        eraseY: bottom - 6,
        eraseW: 542,
        eraseH: top - bottom + 88,
        text: lines.join('\n'),
        textY: top - 10,
        fontSize: 10,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    ],
  };
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
  applyGrouped(overlays, consumed, tryBuildRetainerInvoicingAddressOverlay(pageNum, items, tokenMap));
  applyGrouped(overlays, consumed, tryBuildRetainerActivationFeeOverlay(pageNum, items, tokenMap));

  return { overlays, consumed };
}
