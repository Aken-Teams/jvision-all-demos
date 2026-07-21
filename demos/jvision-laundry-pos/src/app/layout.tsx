import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

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
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
