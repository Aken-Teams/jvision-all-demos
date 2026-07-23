import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision AI 工作區 Demo",
  description: "Jvision AI 工作區、文件、知識庫、專案任務、會議筆記、代理人與自動化流程互動展示。",
  openGraph: {
    title: "Jvision AI 工作區 Demo",
    description: "線上測試文件、任務、會議筆記、知識庫問答、代理人指派與專案報告流程。",
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-people-workspace">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
