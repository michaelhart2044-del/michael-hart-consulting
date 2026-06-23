import { createRequire } from 'node:module';

type PdfJsWorkerGlobal = typeof globalThis & {
  pdfjsWorker?: { WorkerMessageHandler?: unknown };
};

/** pdfjs-dist needs browser canvas APIs + in-process worker on the server. */
export async function ensurePdfJsNodeEnvironment(): Promise<void> {
  if (typeof globalThis.DOMMatrix === 'undefined') {
    try {
      await import('@napi-rs/canvas');
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

  const g = globalThis as PdfJsWorkerGlobal;
  if (g.pdfjsWorker?.WorkerMessageHandler) return;

  const worker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
  g.pdfjsWorker = worker as PdfJsWorkerGlobal['pdfjsWorker'];

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    try {
      const require = createRequire(`${process.cwd()}/package.json`);
      pdfjs.GlobalWorkerOptions.workerSrc = require.resolve(
        'pdfjs-dist/legacy/build/pdf.worker.mjs',
      );
    } catch {
      // globalThis.pdfjsWorker is enough for the in-process fake worker path.
    }
  }
}
