import type { Metadata } from "next";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 企業財務記帳 Demo",
  description: "Jvision 銀行明細匯入、直覺記帳、應收付、代墊款、專案損益與三大財報互動展示。",
  openGraph: {
    title: "Jvision 企業財務記帳 Demo",
    description: "線上測試銀行匯入、記帳分類、財報產生、應收付、代墊款與專案損益流程。",
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-trust-ledger">
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
