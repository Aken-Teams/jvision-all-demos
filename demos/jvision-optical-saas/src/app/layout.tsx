import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 眼鏡門市預約會員經營 Demo",
  description:
    "Jvision 眼鏡門市預約會員經營 Demo，整合 24H 預約、會員 CRM、驗光處方、配鏡回訪、LINE 精準推播、好評邀請與隱形眼鏡商城。",
  openGraph: {
    title: "Jvision 眼鏡門市預約會員經營 Demo",
    description: "可操作的眼鏡店管理展示，支援預約、會員、驗光處方、回訪追蹤、LINE 訊息與 AI 助理。",
    images: ["https://www.jvision-ai.com/public/logo.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-revenue-lift">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
