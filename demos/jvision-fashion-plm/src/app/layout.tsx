import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://jvision-fashion-plm.vercel.app"),
  title: "Jvision 服裝系列開發 PLM 平台",
  description:
    "整合系列企劃、款式監控、BOM 物料、雲端檔案、動態報表與 AI 摘要的 Fashion PLM Demo。",
  openGraph: {
    title: "Jvision 服裝系列開發 PLM 平台",
    description: "服裝品牌與設計、生產、採購團隊可直接操作的 PLM Demo。",
    images: ["/marketing/jvision-fashion-plm-poster.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-factory-command">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
