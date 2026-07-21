const nextConfig = {
  turbopack: {
    root: process.cwd()
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
