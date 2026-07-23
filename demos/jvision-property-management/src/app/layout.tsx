import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 房產租賃代管 Demo",
  description: "Jvision 房源、租約、帳單、修繕、點交、AI 現況與租金對帳 demo。",
  openGraph: {
    title: "Jvision 房產租賃代管 Demo",
    description: "立即體驗房源管理、線上簽約、租金帳單、修繕追蹤與點退續約流程。",
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-people-workspace">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
