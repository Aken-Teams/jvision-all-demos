import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 供應商品質管理 Demo",
  description: "Jvision SQM 供應商品質管理平台，展示採購收料、IQC 檢驗、供應商文件、綠色產品資料與評鑑稽核流程。",
  openGraph: {
    title: "Jvision 供應商品質管理 Demo",
    description: "可互動測試的 Jvision 供應商品質管理平台。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
              <script src="/jvision-analytics.js" defer />
      </body>
    </html>
  );
}
