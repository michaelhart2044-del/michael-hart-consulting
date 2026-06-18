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
const MUTED = colors.subtle;
const BODY = '#1e293b';
const FOOTER_H = 72;
const MINI_HEADER_H = 42;
const CLOSING_H = 58;

const SECTION_HEADER = /^(DEFINE|RECOMMENDED APPROACH|CLIENT PITCH)\s*[—–-]/i;

interface PdfLayoutContext {
  clientName: string;
  logo: Buffer;
}

/** Pacific time — matches primary business timezone. */
function formatProposalTimestamp(date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function contentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function contentBottom(doc: PDFKit.PDFDocument): number {
  return doc.page.height - doc.page.margins.bottom - FOOTER_H;
}

/** Page 1 — full branded cover (body starts on page 2). */
function drawCoverPage(doc: PDFKit.PDFDocument, clientName: string, logo: Buffer): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = 80;
  const centerX = (left + right) / 2;

  doc.image(logo, centerX - 36, top, { width: 72, height: 72 });

  doc
    .font('Times-Bold')
    .fontSize(16)
    .fillColor(NAVY)
    .text(site.name, left, top + 88, { width: contentWidth(doc), align: 'center' });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(MUTED)
    .text(site.tagline, left, doc.y + 6, { width: contentWidth(doc), align: 'center' });

  const ruleY = doc.y + 22;
  doc
    .moveTo(left + 80, ruleY)
    .lineTo(right - 80, ruleY)
    .strokeColor(GOLD)
    .lineWidth(1.5)
    .stroke();

  doc
    .font('Times-Bold')
    .fontSize(26)
    .fillColor(NAVY)
    .text('Initial Proposal', left, ruleY + 28, { width: contentWidth(doc), align: 'center' });

  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor(BODY)
    .text(`Prepared for ${clientName}`, left, doc.y + 10, { width: contentWidth(doc), align: 'center' });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(MUTED)
    .text(formatProposalTimestamp(), left, doc.y + 8, { width: contentWidth(doc), align: 'center' });

  doc
    .font('Helvetica-Oblique')
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      `Prepared exclusively for ${clientName} — confidential. Not for distribution without written consent.`,
      left + 40,
      doc.y + 18,
      { width: contentWidth(doc) - 80, align: 'center', lineGap: 2 },
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

  const services = [
    'Forensic Accounting & Litigation Support',
    'Business Setup & Structuring',
    'Mergers & Acquisitions Advisory',
    'Financial Forecasting & Strategy',
    'AI & Automation Solutions',
  ];

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(services.map((s) => `•  ${s}`).join('\n'), left, servicesY + 14, {
      width: contentWidth(doc),
      align: 'center',
      lineGap: 3,
    });
}

/** Pages 2+ — compact running header. */
function drawMiniHeader(doc: PDFKit.PDFDocument, clientName: string, logo: Buffer): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = doc.page.margins.top;

  doc.image(logo, left, top, { width: 22, height: 22 });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(MUTED)
    .text(`Initial Proposal  •  ${clientName}`, left + 30, top + 7, {
      width: contentWidth(doc) - 30,
      align: 'left',
    });

  const ruleY = top + MINI_HEADER_H - 8;
  doc
    .moveTo(left, ruleY)
    .lineTo(right, ruleY)
    .strokeColor(GOLD)
    .lineWidth(0.5)
    .opacity(0.45)
    .stroke()
    .opacity(1);

  doc.y = ruleY + 12;
}

function ensureSpace(doc: PDFKit.PDFDocument, ctx: PdfLayoutContext, needed: number): void {
  if (doc.y + needed > contentBottom(doc)) {
    doc.addPage();
    drawMiniHeader(doc, ctx.clientName, ctx.logo);
  }
}

function renderProposalBody(doc: PDFKit.PDFDocument, proposalText: string, ctx: PdfLayoutContext): void {
  const width = contentWidth(doc);
  const lines = proposalText.split('\n');

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      ensureSpace(doc, ctx, 10);
      doc.moveDown(0.35);
      continue;
    }

    if (SECTION_HEADER.test(trimmed)) {
      ensureSpace(doc, ctx, 36);
      doc.moveDown(0.6);
      doc.font('Times-Bold').fontSize(12.5).fillColor(GOLD).text(trimmed, { width, lineGap: 1 });
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(10.5).fillColor(BODY);
      continue;
    }

    if (/^[-•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      ensureSpace(doc, ctx, 16);
      doc.text(trimmed, { width, indent: 12, lineGap: 2.5, paragraphGap: 2 });
      continue;
    }

    if (trimmed.startsWith('—')) {
      ensureSpace(doc, ctx, 16);
      doc.font('Helvetica-Oblique').fontSize(10.5).fillColor(BODY);
      doc.text(trimmed, { width, lineGap: 2 });
      doc.font('Helvetica').fontSize(10.5);
      continue;
    }

    ensureSpace(doc, ctx, 16);
    doc.font('Helvetica').fontSize(10.5).fillColor(BODY);
    doc.text(trimmed, { width, align: 'left', lineGap: 2.5, paragraphGap: 3 });
  }
}

/** Text sign-off on the last content page. */
function drawClosingBlock(doc: PDFKit.PDFDocument, ctx: PdfLayoutContext): void {
  ensureSpace(doc, ctx, CLOSING_H + 12);
  doc.moveDown(1.2);

  const left = doc.page.margins.left;
  const width = contentWidth(doc);

  doc
    .moveTo(left, doc.y)
    .lineTo(left + width * 0.35, doc.y)
    .strokeColor(GOLD)
    .lineWidth(0.75)
    .opacity(0.55)
    .stroke()
    .opacity(1);

  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(10.5).fillColor(NAVY).text('Michael Hart, Founder', { width });
  doc.font('Helvetica').fontSize(10).fillColor(BODY).text(site.name, { width });
  doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(`${site.phone}  •  ${site.email}`, { width });
}

function drawPageFooter(doc: PDFKit.PDFDocument, pageIndex: number, pageCount: number): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const footerTop = doc.page.height - doc.page.margins.bottom - 52;

  if (pageIndex === 0) {
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(MUTED)
      .text(site.name, left, footerTop + 14, { width: contentWidth(doc), align: 'center' });
    return;
  }

  doc
    .moveTo(left, footerTop)
    .lineTo(right, footerTop)
    .strokeColor(GOLD)
    .lineWidth(0.75)
    .opacity(0.55)
    .stroke()
    .opacity(1);

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(MUTED)
    .text(`${site.phone}  •  ${site.email}  •  ${site.url.replace(/^https?:\/\//, '')}`, left, footerTop + 8, {
      width: contentWidth(doc),
      align: 'left',
    });

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(MUTED)
    .text(`${site.name}  •  Page ${pageIndex + 1} of ${pageCount}`, left, footerTop + 20, {
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
      margins: { top: 48, bottom: 64, left: 54, right: 54 },
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
