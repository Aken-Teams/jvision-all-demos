import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 智慧照護管理 Demo",
  description: "Jvision 智慧照護管理系統，提供長者床位、照護紀錄、班表、庫存、帳務與品質指標 demo。",
  openGraph: {
    title: "Jvision 智慧照護管理 Demo",
    description: "立即體驗長者床位、照護紀錄、護理交班、耗材庫存、班表人力與帳務管理流程。",
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
