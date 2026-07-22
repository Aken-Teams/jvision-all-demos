import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 美業預約營運平台 Demo",
  description: "Jvision 美業預約營運平台，展示自助預約、智慧排班、客戶檔案、POS、會員、表單、訊息行銷與多店報表流程。",
  openGraph: {
    title: "Jvision 美業預約營運平台 Demo",
    description: "可互動測試的沙龍、SPA、美療、按摩與多店營運平台。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
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
