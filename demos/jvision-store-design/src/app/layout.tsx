import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 網店設計與開店 Demo",
  description: "Jvision 品牌網店設計、拖曳式頁面編輯、商品上架、表單、SEO 與訂單管理 demo。",
  openGraph: {
    title: "Jvision 網店設計與開店 Demo",
    description: "立即體驗品牌網店設計、商品卡、表單、SEO、加入購物車與訂單管理流程。",
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
