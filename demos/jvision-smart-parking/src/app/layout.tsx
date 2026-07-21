import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 智慧停車場管理 Demo",
  description: "Jvision 智慧停車場管理平台，展示車牌辨識、AI 空車位偵測、車位導引、EV 地鎖、VIP 訪客車位與安全事件監控流程。",
  openGraph: {
    title: "Jvision 智慧停車場管理 Demo",
    description: "可互動測試的 AI 智慧停車場管理平台。",
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
