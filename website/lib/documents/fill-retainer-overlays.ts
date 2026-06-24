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
/** Match PandaDoc body text in General Terms notices column. */
const NOTICES_COL_X = 71;

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
  const eraseX = Math.min(first.x, last.x) - 10;

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX,
        eraseY: bottom.y - 6,
        eraseW: COVER_COL.x + COVER_COL.w - eraseX + 8,
        eraseH: top.y - bottom.y + top.height + 12,
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
  // Cover Customer/Contractor party lines only — stop below "by and between:" (y≈682).
  for (const item of items) {
    if (item.y >= 600 && item.y <= 664 && item.x >= 35 && item.x <= 560) {
      consumed.add(item);
    }
  }

  const line1 = `Customer: ${companyName}, with its principal place of business at ${address} ("Customer"); and`;
  const line2 =
    'Contractor: Michael Hart Consulting Group LLC, a Georgia limited liability company, with its principal place of business at 246 Round Pond Drive, Lilburn, GA 30047 ("Contractor").';

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX: 35,
        eraseY: 598,
        eraseW: 542,
        eraseH: 64,
        text: `${line1}\n${line2}`,
        textY: 654,
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
    if (item.str === 'Email:' && Math.abs(item.y - (email?.y ?? 398)) < 4) consumed.add(item);
  }

  const topY = company.y;
  const bottomY = email?.y ?? street.y;
  const eraseY = bottomY - 6;
  const eraseH = topY - bottomY + company.height + 14;

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX: NOTICES_COL_X - 2,
        eraseY,
        eraseW: 480,
        eraseH,
        text: `${companyName}\n${address}\nEmail: ${clientEmail}`,
        textY: topY,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
        padX: 0,
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
        eraseX: contractorFirst.x - 2,
        eraseY: contractorFirst.y - 2,
        eraseW: contractorLast.x + contractorLast.width - contractorFirst.x + 4,
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
        eraseX: signFirst.x - 2,
        eraseY: signFirst.y - 2,
        eraseW: signLast.x + signLast.width - signFirst.x + 4,
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

  // Cover stray bracket/pipe artifacts between sign-name columns.
  if (contractorFirst && signFirst) {
    overlays.push(
      overlaySpec({
        eraseX: SIG_LEFT.x + SIG_LEFT.w,
        eraseY: contractorFirst.y - 4,
        eraseW: SIG_RIGHT.x - (SIG_LEFT.x + SIG_LEFT.w),
        eraseH: contractorFirst.height + 8,
        text: '',
        textY: contractorFirst.y,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    );
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
    if (item.y >= 310 && item.y <= 430 && item.x >= 35 && item.x <= 420) consumed.add(item);
  }

  const lines = [
    `Total Phase 1 engagement fee: $${totalFee}`,
    `Activation due at signing: $${retainerAmt} (${credited} credited toward total)`,
    `Balance due at delivery: $${balanceDue}`,
    'Retainer is due upon signing via the payment method in the Agreement.',
    'Additional services beyond this SOW require prior written approval and separate fees.',
  ];

  return {
    consumed,
    overlays: [
      overlaySpec({
        eraseX: 35,
        eraseY: 308,
        eraseW: 542,
        eraseH: 128,
        text: lines.join('\n'),
        textY: 418,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    ],
  };
}

/** Page 13 — Attachment A party line + proposal date (no token gaps). */
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
  if (!companyName) return null;

  const sowCompany = findKey(items, 'Client.Company');
  if (sowCompany) {
    for (const item of items) {
      if (item.y >= 566 && item.y <= 616 && item.x >= 35 && item.x <= 560) consumed.add(item);
    }
    overlays.push(
      overlaySpec({
        eraseX: 35,
        eraseY: 566,
        eraseW: 542,
        eraseH: 52,
        text:
          'This Statement of Work ("SOW") is entered into by and between Michael Hart Consulting Group LLC ("Contractor") and ' +
          `${companyName} ("Customer") under the Engagement Activation Retainer between the parties (the "Agreement"), effective as of the Agreement Effective Date.`,
        textY: 608,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    );
    consumed.add(sowCompany);
  }

  const proposalToken = findKey(items, 'PROPOSAL DATE');
  if (proposalToken && proposalDate) {
    for (const item of items) {
      if (item.y >= 500 && item.y <= 552 && item.x >= 35 && item.x <= 560) consumed.add(item);
    }
    overlays.push(
      overlaySpec({
        eraseX: 35,
        eraseY: 500,
        eraseW: 542,
        eraseH: 54,
        text: `Customer received a proposal from Contractor dated ${proposalDate} (the "Proposal"). This SOW incorporates the Proposal by reference.`,
        textY: 546,
        fontSize: FONT_BODY,
        bgColor: ERASE_WHITE,
        textColor: TEXT_COLOR,
      }),
    );
    consumed.add(proposalToken);
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
