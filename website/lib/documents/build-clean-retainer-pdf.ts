/** SignWell-ready master PDF — bracket tokens stay visible; SignWell Text Fields prefill values. */
export async function buildCleanRetainerSourcePdf(source: Buffer): Promise<Buffer> {
  // No-op: retainer-activation.pdf is uploaded to SignWell as-is with [Token.Name] placeholders.
  return source;
}
