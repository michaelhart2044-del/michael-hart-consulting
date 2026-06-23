import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit + pdfjs load native/assets from disk — must not be bundled for serverless.
  serverExternalPackages: ['pdfkit', 'pdfjs-dist', '@napi-rs/canvas', 'pdf-lib'],
  outputFileTracingIncludes: {
    '/admin': [
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      './node_modules/pdfjs-dist/legacy/build/pdf.mjs',
      './node_modules/@napi-rs/canvas/**/*',
    ],
  },
};

export default nextConfig;
