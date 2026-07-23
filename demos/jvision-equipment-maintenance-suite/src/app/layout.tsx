import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 設備維護整合平台",
  description: "整合設備維護、智慧設備維護與預防保養的互動 Demo",
  openGraph: {
    title: "Jvision 設備維護整合平台",
    description: "設備履歷、故障通報、巡檢保養、備品、MTBF / MTTR 與 AI 維護摘要 Demo。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-field-route">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
