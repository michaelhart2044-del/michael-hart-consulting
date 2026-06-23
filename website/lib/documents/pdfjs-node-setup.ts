/** pdfjs-dist needs browser canvas APIs (DOMMatrix, etc.) on the server. */
export async function ensurePdfJsNodeEnvironment(): Promise<void> {
  if (typeof globalThis.DOMMatrix !== 'undefined') return;

  try {
    await import('@napi-rs/canvas');
    if (typeof globalThis.DOMMatrix !== 'undefined') return;
  } catch {
    // Fall through to minimal stubs for text extraction.
  }

  if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = class DOMMatrix {
      is2D = true;
      constructor(_init?: string | number[]) {}
    } as typeof DOMMatrix;
  }

  if (typeof globalThis.Path2D === 'undefined') {
    globalThis.Path2D = class Path2D {} as typeof Path2D;
  }

  if (typeof globalThis.ImageData === 'undefined') {
    globalThis.ImageData = class ImageData {
      width: number;
      height: number;
      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
      }
    } as typeof ImageData;
  }
}
