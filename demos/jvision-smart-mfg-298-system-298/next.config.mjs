const hubBasePath = (process.env.JVISION_BASE_PATH || "").trim();
const isStaticExport = process.env.JVISION_STATIC_EXPORT === "1";

const nextConfig = {
  output: isStaticExport ? "export" : undefined,
  basePath: hubBasePath,
  assetPrefix: hubBasePath || undefined,
  trailingSlash: isStaticExport,
  images: { unoptimized: isStaticExport },
};

export default nextConfig;
