import fs from 'fs';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ShadingType,
  VerticalAlign,
} from 'docx';

const gold = '8F6F3D';
const navy = '0A0F2C';
const muted = '64748B';

function cell(text, opts = {}) {
  const { bold = false, header = false, width = 900 } = opts;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: header ? { fill: navy, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text,
            bold: bold || header,
            size: header ? 18 : 17,
            color: header ? 'FFFFFF' : '111111',
            font: 'Arial',
          }),
        ],
      }),
    ],
  });
}

function row(cells) {
  return new TableRow({ children: cells });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 20 } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 900, right: 900, bottom: 900, left: 900 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: 'Michael Hart Consulting', bold: true, size: 28, color: navy, font: 'Arial' }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: 'End-to-End Test Checklist — Website to Portal Access',
              bold: true,
              size: 22,
              color: gold,
              font: 'Arial',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: 'Production: michaelhartconsulting.com  •  Staff: /admin/login  •  Portal: /portal/login',
              size: 16,
              color: muted,
              font: 'Arial',
            }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [700, 1100, 3200, 3560],
          rows: [
            row([
              cell('Step', { header: true, width: 700 }),
              cell('Who', { header: true, width: 1100 }),
              cell('Action', { header: true, width: 3200 }),
              cell('Verify / Badge', { header: true, width: 3560 }),
            ]),
            row([
              cell('1'),
              cell('Client'),
              cell('Go to /prepare-analysis. Fill name, email, industry, challenges, team size, success goals, context. Submit.'),
              cell('Screen: "Step 1 done." No emails yet. Admin Refresh → BOOKING PENDING'),
            ]),
            row([
              cell('2'),
              cell('Client'),
              cell('Click Pick a Time & Book. Complete Calendly. Wait for "You\'re booked" screen.'),
              cell('Client: Calendly email (check spam). Michael: "Initial Consultation Booked" + prep-answers.txt. Admin → CONSULT BOOKED'),
            ]),
            row([
              cell('3'),
              cell('Michael'),
              cell('30-min call (or simulate). In /admin → Load client → paste transcript/notes in textarea.'),
              cell('Notes saved for proposal & SigVai. (No badge)'),
            ]),
            row([
              cell('4'),
              cell('Michael'),
              cell('Click Copy for SigVai → paste into SigVai → generate DEFINE + CLIENT PITCH.'),
              cell('Clipboard starts with === SIGVAI INPUT - READY TO PASTE ==='),
            ]),
            row([
              cell('5'),
              cell('Michael'),
              cell('Click Generate Initial Proposal. Edit text. Optional: Save Draft, Copy All, Download .txt.'),
              cell('Proposal visible in admin editor.'),
            ]),
            row([
              cell('6'),
              cell('Michael'),
              cell('Generate Email Draft → send to client (or simulate). Click Mark as Sent.'),
              cell('Admin badge: SENT'),
            ]),
            row([
              cell('7'),
              cell('Both'),
              cell('Simulate: client reviews proposal, signs agreement, pays non-refundable fee.'),
              cell('Offline step — no button yet.'),
            ]),
            row([
              cell('8'),
              cell('Michael'),
              cell('In Steps 8–9 section (or card): Mark Step 8 — Agreement & Payment Received.'),
              cell('Badge: STEP 8. Grant Portal Access button unlocks.'),
            ]),
            row([
              cell('9'),
              cell('Michael'),
              cell('Click Grant Portal Access within 48 hours of Step 8. Client receives welcome email with temp password + /portal/login link.'),
              cell('Badge: PORTAL — AWAITING LOGIN. Resend if email missing.'),
            ]),
            row([
              cell('9b'),
              cell('Client'),
              cell('Open welcome email. Go to /portal/login. Sign in with temp password. Set permanent password.'),
              cell('Badge: PORTAL ACTIVE. Client lands on private portal questionnaire.'),
            ]),
          ],
        }),
        new Paragraph({
          spacing: { before: 140, after: 60 },
          children: [
            new TextRun({ text: 'Quick reset (single client): ', bold: true, size: 17, font: 'Arial' }),
            new TextRun({
              text: 'Revoke Access → Re-grant for portal re-test. Delete one client to re-run from Step 1. Avoid "Delete All" unless intentional.',
              size: 17,
              font: 'Arial',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 0 },
          children: [
            new TextRun({ text: 'Test email used: _____________________________   Date: _______________', size: 17, font: 'Arial' }),
          ],
        }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
const outPath = 'C:/MH_Consulting_Website/website/End-to-End-Flow-Checklist.docx';
fs.writeFileSync(outPath, buffer);
console.log('Created:', outPath);