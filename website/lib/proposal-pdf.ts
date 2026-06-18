/**
 * Server-only PDF generation for client proposals.
 */

import PDFDocument from 'pdfkit';

export async function generateProposalPdfBuffer(params: {
  clientName: string;
  proposalText: string;
}): Promise<Buffer> {
  const { clientName, proposalText } = params;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 54, bottom: 54, left: 54, right: 54 },
      info: {
        Title: `Proposal — ${clientName}`,
        Author: 'Michael Hart Consulting Group LLC',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#111111').text(`Proposal for ${clientName}`);
    doc.moveDown(0.4);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#555555')
      .text(`Michael Hart Consulting Group LLC • ${new Date().toLocaleDateString('en-US')}`);
    doc.moveDown(1.2);
    doc.font('Helvetica').fontSize(11).fillColor('#111111').text(proposalText, {
      width: contentWidth,
      align: 'left',
      lineGap: 3,
    });

    doc.end();
  });
}
