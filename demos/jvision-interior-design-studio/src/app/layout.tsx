import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jvision-interior-design-studio.vercel.app"),
  title: "Jvision 室內設計專案管理平台",
  description: "整合提案、選品板、商品資料庫、採購追蹤、客戶儀表板與 AI 摘要的室內設計 Demo。",
  openGraph: {
    title: "Jvision 室內設計專案管理平台",
    description: "可以實際操作的室內設計專案管理 Demo。",
    images: ["/marketing/jvision-interior-design-studio-poster.png"],
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
