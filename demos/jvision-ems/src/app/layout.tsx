import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 能源管理系統 Demo",
  description: "Jvision EMS 智慧電表、用電監控、節能控制、碳排計算、告警管理與能源報表互動展示。",
  openGraph: {
    title: "Jvision 能源管理系統 Demo",
    description: "線上測試電表讀值、用電趨勢、需量告警、節能策略、碳排計算與能源報表。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-green-impact">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
