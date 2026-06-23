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

function escapePdfLiteralText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function fillPdfTokenBuffer(pdf: Buffer, tokenMap: Record<string, string>): Buffer {
  let content = pdf.toString('latin1');
  for (const [search, rawValue] of buildPdfTokenReplacements(tokenMap)) {
    if (!content.includes(search)) continue;
    const value = escapePdfLiteralText(rawValue);
    content = content.split(search).join(value);
  }
  return Buffer.from(content, 'latin1');
}
