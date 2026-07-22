import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 藥局健保調劑申報 Demo",
  description:
    "Jvision 藥局健保調劑申報 Demo，整合處方輸入、健保藥價更新、申報檢核、藥袋列印、部分負擔、歷史申報與藥品耗用分析。",
  openGraph: {
    title: "Jvision 藥局健保調劑申報 Demo",
    description: "可操作的藥局申報工作台，支援處方建立、用藥檢核、費用試算、申報錯誤修正與報表列印。",
    images: ["https://www.jvision-ai.com/public/logo.png"]
  }
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
