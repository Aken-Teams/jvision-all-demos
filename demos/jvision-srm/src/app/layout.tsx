import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 採購供應商協作平台 Demo",
  description:
    "Jvision SRM 採購供應商協作平台 Demo，整合供應商管理、詢報價、電子競標、訂單交期、履約驗收、ERP 介接與 AI 採購摘要。",
  openGraph: {
    title: "Jvision 採購供應商協作平台 Demo",
    description: "可操作的 SRM 展示，支援供應商協作、採購案件、報價比較、交期風險與 AI 採購摘要。",
    images: ["https://www.jvision-ai.com/public/logo.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-supply-flow">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
