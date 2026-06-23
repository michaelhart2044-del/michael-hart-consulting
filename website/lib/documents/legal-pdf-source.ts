import fs from 'fs/promises';
import path from 'path';

export type LegalPdfKind = 'nda' | 'retainer';

const DEFAULT_FILENAME: Record<LegalPdfKind, string> = {
  nda: 'nda-mutual.pdf',
  retainer: 'retainer-activation.pdf',
};

const ENV_KEY: Record<LegalPdfKind, string> = {
  nda: 'SIGNWELL_SOURCE_PDF_NDA',
  retainer: 'SIGNWELL_SOURCE_PDF_RETAINER',
};

export function legalPdfDefaultPath(kind: LegalPdfKind): string {
  return path.join(process.cwd(), 'templates', 'legal', DEFAULT_FILENAME[kind]);
}

/** Source PDF used to bake merge data before upload to SignWell (same file uploaded to SignWell templates). */
export async function readLegalSourcePdf(kind: LegalPdfKind): Promise<Buffer> {
  const envPath = process.env[ENV_KEY[kind]]?.trim();
  const candidates = [envPath, legalPdfDefaultPath(kind)].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate);
    } catch {
      // try next path
    }
  }

  throw new Error(
    `Legal PDF source not found for ${kind}. Add templates/legal/${DEFAULT_FILENAME[kind]} (your PandaDoc export) or set ${ENV_KEY[kind]} in Vercel.`,
  );
}

export function legalPdfOutputName(kind: LegalPdfKind, companyOrName: string): string {
  const base = kind === 'nda' ? 'nda' : 'retainer';
  const safe = companyOrName.replace(/[^\w.-]+/g, '-').slice(0, 60);
  return `${base}-${safe || 'client'}.pdf`;
}
