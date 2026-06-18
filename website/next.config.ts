import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit loads Helvetica metrics from disk — must not be bundled for serverless.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
