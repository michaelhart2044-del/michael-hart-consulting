import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit + pdfjs load native/assets from disk — must not be bundled for serverless.
  serverExternalPackages: ['pdfkit', 'pdfjs-dist', '@napi-rs/canvas', 'pdf-lib'],
};

export default nextConfig;
