import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 餐飲 POS 科技 Demo",
  description: "Jvision 餐廳 POS、線上接單、訂位、會員、成本控管與銷售分析一站式 demo。",
  openGraph: {
    title: "Jvision 餐飲 POS 科技 Demo",
    description: "立即體驗餐廳點餐、結帳、線上接單、訂位、會員與營運報表的完整流程。",
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
