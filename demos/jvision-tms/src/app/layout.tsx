import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 物流派車 物流運輸管理 Demo",
  description: "Jvision 物流派車 訂單管理、智慧調度、路線優化、車隊追蹤、電子簽收與運費結算互動展示。",
  openGraph: {
    title: "Jvision 物流派車 物流運輸管理 Demo",
    description: "線上測試配送訂單、派車調度、貨態更新、簽收回傳與運費結算流程。",
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
