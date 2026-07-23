import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 智能 POS OMO Demo",
  description: "Jvision 智能 POS、OMO 會員整合、門市收銀、庫存、分潤、電子標籤與 AI 店務 demo。",
  openGraph: {
    title: "Jvision 智能 POS OMO Demo",
    description: "立即體驗零售門市收銀、會員、庫存、分潤、數位看板與智慧店務的完整流程。",
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-revenue-lift">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
