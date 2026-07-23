import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 旅宿營運管理 Demo",
  description: "Jvision 旅宿 房況管理、官網訂房、訂房平台 控房、動態房價、加購服務與結算報表互動展示。",
  openGraph: {
    title: "Jvision 旅宿營運管理 Demo",
    description: "線上測試房況控房、訂房平台 訂單、官網訂房、加購服務與營收結算流程。",
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-guest-delight">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
