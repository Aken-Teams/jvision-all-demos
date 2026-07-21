import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 印刷業解決方案 Demo",
  description: "Jvision 印刷業解決方案，展示估價轉單、圖檔版模、排版整合、合版排程、託外加工、WIP、領料入庫與實際成本流程。",
  openGraph: {
    title: "Jvision 印刷業解決方案 Demo",
    description: "可互動測試的印刷估價、生產、託外與成本管理平台。",
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
