import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 洗衣門市管理 Demo",
  description: "Jvision 洗衣門市管理平台，展示客戶資料、送洗衣服登入、衣物入庫、取件付款、每日支出、日月報表與資料備份流程。",
  openGraph: {
    title: "Jvision 洗衣門市管理 Demo",
    description: "可互動測試的洗衣門市收件與營業管理平台。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
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
