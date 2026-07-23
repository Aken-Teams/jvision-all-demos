import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 建築工程管理 Demo",
  description: "Jvision 建築工程專案、工地日報、品質安衛、材料成本與審批流程一站式 demo。",
  openGraph: {
    title: "Jvision 建築工程管理 Demo",
    description: "立即體驗建築專案進度、品質安衛、材料成本與審批流程的完整 demo。",
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-site-blueprint">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
