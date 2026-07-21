import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

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
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
