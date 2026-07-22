import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 智慧診所管理 Demo",
  description: "Jvision 智慧診所預約、候診、病歷摘要、排班薪資、庫存與營運儀表板 demo。",
  openGraph: {
    title: "Jvision 智慧診所管理 Demo",
    description: "立即體驗診所預約、候診、病歷摘要、排班、薪資、倉管與營運數據流程。",
    images: ["https://www.jvision-ai.com/public/logo.png"]
  }
};

export default function RootLayout({
  children
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
