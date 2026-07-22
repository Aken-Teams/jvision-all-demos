import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision CRM Demo",
  description: "Jvision CRM 提供客戶管理、銷售管線、任務追蹤、活動紀錄與報表分析的完整互動 Demo。",
  openGraph: {
    title: "Jvision CRM Demo",
    description: "直接操作 Jvision CRM，測試客戶、商機、任務、管線與報表流程。",
    images: ["https://www.jvision-ai.com/public/logo.png"]
  }
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
