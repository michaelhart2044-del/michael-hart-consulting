/**
 * Branded server-only PDF generation for client proposals.
 */

import { promises as fs } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { colors } from '@/lib/brand-tokens';
import { site } from '@/lib/site';

const NAVY = colors.background;
const GOLD = colors.accent;
const GOLD_DARK = '#8f6f3d';
const MUTED = colors.subtle;
const BODY = '#1e293b';
/** Reserved band above bottom margin — compact footer, bleed-safe via white mask. */
const FOOTER_H = 44;
const FOOTER_GAP = 8;
const PAGE_BOTTOM_MARGIN = 54;
const MINI_HEADER_H = 42;
/** Breathing room between last body paragraph and sign-off rule. */
const CLOSING_SEP_GAP = 34;
const CLOSING_LINE_GAP = 6;
const BODY_SIZE = 10.5;

const FONT = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';

/** Round dot — cover page services list only. */
const MARKER_DOT = '\u2022';

const SECTION_HEADER = /^(DEFINE|RECOMMENDED APPROACH|CLIENT PITCH)\s*[—–-]/i;
const BULLET_LINE = /^[-•*]\s+/;
const NUMBERED_LINE = /^\d+\.\s+/;
const SIGNOFF_LINE = /^[—–-]+\s*Michael Hart\s*\.?$/i;

interface PdfLayoutContext {
  clientName: string;
  logo: Buffer;
}

function siteHost(): string {
  return site.url.replace(/^https?:\/\//, '');
}

/** Eastern Time (Lilburn, GA) — Intl auto-switches EDT / EST for daylight saving. */
function formatProposalTimestamp(date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

/** Remove operator-only lines before client delivery. */
export function sanitizeProposalForClient(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^-{3,}$/.test(t)) return false;
      if (/^Source:/i.test(t)) return false;
      if (/Prepared privately/i.test(t)) return false;
      if (/^===\s*SIGVAI/i.test(t)) return false;
      if (/^===\s*END SIGVAI/i.test(t)) return false;
      if (/SigVai\s*\/\s*xAI ready/i.test(t)) return false;
      if (SIGNOFF_LINE.test(t)) return false;
      if (/^Michael Hart\s*\.?$/i.test(t)) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function contentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function footerAreaTop(doc: PDFKit.PDFDocument): number {
  return doc.page.height - doc.page.margins.bottom - FOOTER_H;
}

function contentBottom(doc: PDFKit.PDFDocument): number {
  return footerAreaTop(doc) - FOOTER_GAP;
}

function setBodyFont(doc: PDFKit.PDFDocument): void {
  doc.font(FONT).fontSize(BODY_SIZE).fillColor(BODY);
}

function drawAlignedMarkerList(
  doc: PDFKit.PDFDocument,
  items: string[],
  startY: number,
  fontSize: number,
  marker: string,
): void {
  const left = doc.page.margins.left;
  const width = contentWidth(doc);
  const bulletCol = 14;
  const textIndent = bulletCol + 6;

  doc.font(FONT).fontSize(fontSize);
  const blockWidth = Math.min(
    width,
    Math.max(...items.map((item) => doc.widthOfString(item) + textIndent)),
  );
  const blockLeft = left + (width - blockWidth) / 2;

  let y = startY;
  for (const item of items) {
    doc.font(FONT_BOLD).fontSize(fontSize).fillColor(NAVY).text(marker, blockLeft, y, {
      width: bulletCol,
      lineBreak: false,
    });
    doc.font(FONT).fontSize(fontSize).fillColor(BODY).text(item, blockLeft + textIndent, y, {
      width: blockWidth - textIndent,
      lineGap: 2,
    });
    y = doc.y + 4;
  }
  doc.y = y;
}

/** Page 1 — full branded cover (body starts on page 2). */
function drawCoverPage(doc: PDFKit.PDFDocument, clientName: string, logo: Buffer): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = 80;
  const centerX = (left + right) / 2;
  const width = contentWidth(doc);

  doc.image(logo, centerX - 36, top, { width: 72, height: 72 });

  doc.font(FONT_BOLD).fontSize(16).fillColor(NAVY).text(site.name, left, top + 88, { width, align: 'center' });

  doc.font(FONT).fontSize(9).fillColor(MUTED).text(site.tagline, left, doc.y + 6, { width, align: 'center' });

  const ruleY = doc.y + 22;
  doc.moveTo(left + 80, ruleY).lineTo(right - 80, ruleY).strokeColor(GOLD).lineWidth(1.5).stroke();

  doc.font(FONT_BOLD).fontSize(26).fillColor(NAVY).text('Initial Proposal', left, ruleY + 28, { width, align: 'center' });

  doc.font(FONT).fontSize(12).fillColor(BODY).text(`Prepared for ${clientName}`, left, doc.y + 10, { width, align: 'center' });

  doc.font(FONT).fontSize(10).fillColor(MUTED).text(formatProposalTimestamp(), left, doc.y + 8, { width, align: 'center' });

  doc
    .font(FONT)
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      `Prepared exclusively for ${clientName} — confidential. Not for distribution without written consent.`,
      left + 40,
      doc.y + 18,
      { width: width - 80, align: 'center', lineGap: 2 },
    );

  const servicesY = doc.y + 36;
  doc
    .moveTo(left + 100, servicesY)
    .lineTo(right - 100, servicesY)
    .strokeColor(GOLD)
    .lineWidth(0.5)
    .opacity(0.4)
    .stroke()
    .opacity(1);

  drawAlignedMarkerList(
    doc,
    [
      'Forensic Accounting & Litigation Support',
      'Business Setup & Structuring',
      'Mergers & Acquisitions Advisory',
      'Financial Forecasting & Strategy',
      'AI & Automation Solutions',
    ],
    servicesY + 14,
    8.5,
    MARKER_DOT,
  );
}

/** Pages 2+ — compact running header. */
function drawMiniHeader(doc: PDFKit.PDFDocument, clientName: string, logo: Buffer): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = doc.page.margins.top;

  doc.image(logo, left, top, { width: 22, height: 22 });

  doc.font(FONT).fontSize(8).fillColor(MUTED).text(`Initial Proposal  •  ${clientName}`, left + 30, top + 7, {
    width: contentWidth(doc) - 30,
    align: 'left',
  });

  const ruleY = top + MINI_HEADER_H - 8;
  doc.moveTo(left, ruleY).lineTo(right, ruleY).strokeColor(GOLD).lineWidth(0.5).opacity(0.45).stroke().opacity(1);

  doc.y = ruleY + 12;
}

function ensureSpace(doc: PDFKit.PDFDocument, ctx: PdfLayoutContext, needed: number): void {
  if (doc.y + needed > contentBottom(doc)) {
    doc.addPage();
    drawMiniHeader(doc, ctx.clientName, ctx.logo);
  }
}

function drawBodyLine(
  doc: PDFKit.PDFDocument,
  trimmed: string,
  width: number,
  ctx: PdfLayoutContext,
): void {
  const content = trimmed.replace(BULLET_LINE, '').replace(NUMBERED_LINE, '');

  doc.font(FONT).fontSize(BODY_SIZE);
  const textHeight = doc.heightOfString(content, {
    width,
    lineGap: 2.5,
    paragraphGap: 2,
  });
  ensureSpace(doc, ctx, textHeight + 6);
  doc.fillColor(BODY).text(content, { width, lineGap: 2.5, paragraphGap: 2 });
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, width: number, ctx: PdfLayoutContext): void {
  const left = doc.page.margins.left;

  doc.font(FONT_BOLD).fontSize(13);
  const titleHeight = doc.heightOfString(title, { width, lineGap: 1 });
  // Keep section header with at least one line of body content on the same page.
  ensureSpace(doc, ctx, titleHeight + 24 + 28);

  doc.fillColor(GOLD).text(title, { width, lineGap: 1 });

  const underlineY = doc.y + 5;
  doc.moveTo(left, underlineY).lineTo(left + width, underlineY).strokeColor(GOLD_DARK).lineWidth(1.1).stroke();

  doc.y = underlineY + 12;
  setBodyFont(doc);
}

function renderProposalBody(doc: PDFKit.PDFDocument, proposalText: string, ctx: PdfLayoutContext): void {
  const width = contentWidth(doc);
  const lines = proposalText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      ensureSpace(doc, ctx, 10);
      doc.moveDown(0.35);
      continue;
    }

    if (SIGNOFF_LINE.test(trimmed)) {
      continue;
    }

    if (SECTION_HEADER.test(trimmed)) {
      doc.moveDown(0.5);
      drawSectionHeader(doc, trimmed, width, ctx);
      continue;
    }

    if (BULLET_LINE.test(trimmed) || NUMBERED_LINE.test(trimmed)) {
      drawBodyLine(doc, trimmed, width, ctx);
      continue;
    }

    drawBodyLine(doc, trimmed, width, ctx);
  }
}

function measureClosingBlockHeight(doc: PDFKit.PDFDocument): number {
  const width = contentWidth(doc);

  doc.font(FONT_BOLD).fontSize(BODY_SIZE);
  const nameHeight = doc.heightOfString('Michael Hart, Founder', { width });
  doc.font(FONT).fontSize(BODY_SIZE);
  const firmHeight = doc.heightOfString(site.name, { width });

  return CLOSING_SEP_GAP + 10 + nameHeight + CLOSING_LINE_GAP + firmHeight;
}

/** Name + firm only — contact details live in the page footer. */
function drawClosingBlock(doc: PDFKit.PDFDocument, ctx: PdfLayoutContext): void {
  const left = doc.page.margins.left;
  const width = contentWidth(doc);
  const blockHeight = measureClosingBlockHeight(doc);

  ensureSpace(doc, ctx, blockHeight + 4);
  doc.y += CLOSING_SEP_GAP;

  doc.moveTo(left, doc.y).lineTo(left + width * 0.32, doc.y).strokeColor(GOLD_DARK).lineWidth(0.75).stroke();
  doc.y += 10;

  doc.font(FONT_BOLD).fontSize(BODY_SIZE).fillColor(NAVY).text('Michael Hart, Founder', { width, lineGap: 1 });
  doc.moveDown(0.2);
  doc.font(FONT).fontSize(BODY_SIZE).fillColor(BODY).text(site.name, { width, lineGap: 1 });
}

function drawPageFooter(doc: PDFKit.PDFDocument, pageIndex: number, pageCount: number): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const zoneTop = footerAreaTop(doc);
  const pageBottom = doc.page.height;

  // Mask any content that bled into the footer band.
  doc.save();
  doc.rect(left, zoneTop, right - left, pageBottom - zoneTop).fill('#ffffff');
  doc.restore();

  if (pageIndex === 0) {
    doc.font(FONT).fontSize(7.5).fillColor(MUTED).text(site.name, left, zoneTop + 14, {
      width: contentWidth(doc),
      align: 'center',
    });
    return;
  }

  const lineY = zoneTop + 4;
  doc.moveTo(left, lineY).lineTo(right, lineY).strokeColor(GOLD).lineWidth(0.75).opacity(0.55).stroke().opacity(1);

  doc.font(FONT).fontSize(8).fillColor(MUTED).text(`${site.phone}  •  ${site.email}  •  ${siteHost()}`, left, lineY + 8, {
    width: contentWidth(doc),
    align: 'left',
  });

  doc.font(FONT).fontSize(7.5).fillColor(MUTED).text(`${site.name}  •  Page ${pageIndex + 1} of ${pageCount}`, left, lineY + 19, {
    width: contentWidth(doc),
    align: 'left',
  });
}

export async function generateProposalPdfBuffer(params: {
  clientName: string;
  proposalText: string;
}): Promise<Buffer> {
  const { clientName, proposalText } = params;
  const cleanText = sanitizeProposalForClient(proposalText);

  const logo = await fs.readFile(path.join(process.cwd(), 'public', 'mh-logo.png'));
  const ctx: PdfLayoutContext = { clientName, logo };

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 48, bottom: PAGE_BOTTOM_MARGIN, left: 54, right: 54 },
      bufferPages: true,
      info: {
        Title: `Initial Proposal — ${clientName}`,
        Author: site.name,
        Subject: 'Consulting proposal',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawCoverPage(doc, clientName, logo);
    doc.addPage();
    drawMiniHeader(doc, clientName, logo);
    renderProposalBody(doc, cleanText, ctx);
    drawClosingBlock(doc, ctx);

    const range = doc.bufferedPageRange();
    const pageCount = range.count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      drawPageFooter(doc, i, pageCount);
    }

    doc.end();
  });
}
