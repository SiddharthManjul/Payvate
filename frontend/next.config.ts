import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Fix: macOS permission issue when Turbopack traverses to /Desktop
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
