import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 工作管理平台 Demo",
  description: "Jvision 工作管理平台提供任務、專案看板、AI 摘要、目標追蹤、工作負荷與自動化規則的互動展示。",
  openGraph: {
    title: "Jvision 工作管理平台 Demo",
    description: "立即體驗 Jvision 工作管理平台，測試任務新增、專案看板、AI 摘要、目標追蹤與工作量管理。",
    images: ["https://www.jvision-ai.com/public/logo.png"]
  }
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
