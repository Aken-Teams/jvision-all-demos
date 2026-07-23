import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision BI 分析平台 Demo",
  description: "Jvision BI 資料連接、AI 洞察、互動報表、語意模型、治理分享與內嵌分析互動展示。",
  openGraph: {
    title: "Jvision BI 分析平台 Demo",
    description: "線上測試資料集匯入、AI 問答、指標切換、報表產生、發布分享與治理流程。",
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-insight-lab">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
