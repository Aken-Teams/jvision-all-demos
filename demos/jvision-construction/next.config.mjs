const nextConfig = {
  output: "export",
  basePath: "/demos/jvision-construction",
  assetPrefix: "/demos/jvision-construction",
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
