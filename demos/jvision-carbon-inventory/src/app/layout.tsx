import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 組織溫室氣體盤查 Demo",
  description:
    "Jvision 組織溫室氣體盤查 Demo，整合活動資料、排放係數、範疇一/二/三計算、排放清冊、熱點分析與報告輸出。",
  openGraph: {
    title: "Jvision 組織溫室氣體盤查 Demo",
    description: "可操作的企業碳管理展示，支援盤查資料輸入、排放試算、熱點分析與 AI 查核摘要。",
    images: ["https://www.jvision-ai.com/public/logo.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
