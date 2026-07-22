import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 機車行管理 Demo",
  description: "Jvision 機車行管理平台，展示客戶車籍、維修保養單、零件庫存、付款沖銷、報表列印與毛利分析流程。",
  openGraph: {
    title: "Jvision 機車行管理 Demo",
    description: "可互動測試的機車行維修與庫存管理平台。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
              <script src="/jvision-analytics.js" defer />
      </body>
    </html>
  );
}
