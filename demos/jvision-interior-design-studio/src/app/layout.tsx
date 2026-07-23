import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-site-blueprint">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
