import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 工作與專案管理平台",
  description: "整合專案排程、任務看板、工作負荷、目標追蹤、自動化規則與 AI 摘要 Demo",
  openGraph: {
    title: "Jvision 工作與專案管理平台",
    description: "由專案管理、任務管理與工作管理平台合併成新的互動展示 Demo。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-people-workspace">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
