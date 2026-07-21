import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: {
    root: projectRoot
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
