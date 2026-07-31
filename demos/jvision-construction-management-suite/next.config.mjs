import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: "export",
  basePath: "/demos/jvision-construction-management-suite",
  assetPrefix: "/demos/jvision-construction-management-suite",
  turbopack: {
    root: __dirname
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.jvision-ai.com"
      }
    ]
  }
};

export default nextConfig;
