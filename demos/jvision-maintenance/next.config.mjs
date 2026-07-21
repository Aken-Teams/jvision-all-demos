/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: import.meta.dirname },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "www.jvision-ai.com" }]
  }
};

export default nextConfig;
