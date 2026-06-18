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

const SECTION_HEADER = /^(DEFINE|RECOMMENDED APPROACH|CLIENT PITCH)\s*[—–-]/i;

async function readBrandAsset(filename: string): Promise<Buffer> {
  return fs.readFile(path.join(process.cwd(), 'public', 'brand', filename));
}

function contentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function drawPageHeader(doc: PDFKit.PDFDocument, clientName: string, logo: Buffer): number {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = 36;

  doc.image(logo, left, top, { width: 44, height: 44 });

  const textLeft = left + 54;
  const textWidth = right - textLeft;

  doc
    .font('Times-Bold')
    .fontSize(13)
    .fillColor(NAVY)
    .text(site.name, textLeft, top + 2, { width: textWidth, align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(site.tagline, textLeft, top + 20, { width: textWidth, align: 'right' });

  const ruleY = top + 50;
  doc
    .moveTo(left, ruleY)
    .lineTo(right, ruleY)
    .strokeColor(GOLD)
    .lineWidth(1.25)
    .stroke();

  doc
    .font('Times-Bold')
    .fontSize(19)
    .fillColor(NAVY)
    .text('Initial Proposal', left, ruleY + 16);

  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor(MUTED)
    .text(`Prepared for ${clientName}`, left, doc.y + 5);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      left,
      doc.y + 2,
    );

  doc
    .moveTo(left, doc.y + 10)
    .lineTo(right, doc.y + 10)
    .strokeColor(GOLD)
    .lineWidth(0.5)
    .opacity(0.45)
    .stroke()
    .opacity(1);

  return doc.y + 18;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  const bottom = doc.page.height - doc.page.margins.bottom - FOOTER_H;
  if (doc.y + needed > bottom) {
    doc.addPage();
  }
}

function renderProposalBody(doc: PDFKit.PDFDocument, proposalText: string): void {
  const width = contentWidth(doc);
  const lines = proposalText.replace(/\r\n/g, '\n').split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      ensureSpace(doc, 10);
      doc.moveDown(0.35);
      continue;
    }

    if (SECTION_HEADER.test(trimmed)) {
      ensureSpace(doc, 36);
      doc.moveDown(0.6);
      doc.font('Times-Bold').fontSize(12.5).fillColor(GOLD).text(trimmed, { width, lineGap: 1 });
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(10.5).fillColor(BODY);
      continue;
    }

    if (/^[-•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      ensureSpace(doc, 16);
      doc.text(trimmed, { width, indent: 12, lineGap: 2.5, paragraphGap: 2 });
      continue;
    }

    if (trimmed.startsWith('—')) {
      ensureSpace(doc, 16);
      doc.font('Helvetica-Oblique').fontSize(10.5).fillColor(BODY);
      doc.text(trimmed, { width, lineGap: 2 });
      doc.font('Helvetica').fontSize(10.5);
      continue;
    }

    ensureSpace(doc, 16);
    doc.font('Helvetica').fontSize(10.5).fillColor(BODY);
    doc.text(trimmed, { width, align: 'left', lineGap: 2.5, paragraphGap: 3 });
  }
}

function drawPageFooter(
  doc: PDFKit.PDFDocument,
  pageIndex: number,
  pageCount: number,
  signature: Buffer | null,
): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const footerTop = doc.page.height - doc.page.margins.bottom - 52;
  const isLast = pageIndex === pageCount - 1;

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

  if (isLast && signature) {
    const sigWidth = 128;
    const sigHeight = 40;
    const x = right - sigWidth;
    const y = footerTop - sigHeight - 14;

    // Signature asset uses a dark background — place on brand navy panel.
    doc.roundedRect(x - 8, y - 6, sigWidth + 16, sigHeight + 30, 5).fill(NAVY);
    doc.image(signature, x, y, { width: sigWidth, height: sigHeight });
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(GOLD)
      .text('Michael Hart, Founder', x - 8, y + sigHeight + 4, { width: sigWidth + 16, align: 'center' });
  }
}

export async function generateProposalPdfBuffer(params: {
  clientName: string;
  proposalText: string;
}): Promise<Buffer> {
  const { clientName, proposalText } = params;

  const [logo, signature] = await Promise.all([
    fs.readFile(path.join(process.cwd(), 'public', 'mh-logo.png')),
    readBrandAsset('signature-michael-hart.png').catch(() => null),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 36, bottom: 64, left: 54, right: 54 },
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

    doc.y = drawPageHeader(doc, clientName, logo);
    renderProposalBody(doc, proposalText);

    const range = doc.bufferedPageRange();
    const pageCount = range.count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      drawPageFooter(doc, i, pageCount, signature);
    }

    doc.end();
  });
}
