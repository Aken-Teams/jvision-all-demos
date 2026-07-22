import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 寵物服務預約 Demo",
  description: "Jvision 寵物服務預約平台，展示寵物旅館、安親、美容、課程預約、商品加購、入住管理與照護通知流程。",
  openGraph: {
    title: "Jvision 寵物服務預約 Demo",
    description: "可互動測試的一頁式寵物服務預約平台。",
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
      <body>
        {children}
              <script src="/jvision-analytics.js" defer />
      </body>
    </html>
  );
}
