import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://jvision-esg-energy-carbon.vercel.app"),
  title: "Jvision ESG 能源與碳管理平台",
  description: "整合能源監控、溫室氣體盤查、排放分類、減碳任務與 AI 摘要的互動 Demo。",
  openGraph: {
    title: "Jvision ESG 能源與碳管理平台",
    description: "可以實際操作的 ESG 能源與碳管理 Demo。",
    images: ["/marketing/jvision-esg-energy-carbon-poster.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
              <script src="/jvision-analytics.js" defer />
      </body>
    </html>
  );
}
