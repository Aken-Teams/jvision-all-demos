import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 車廠雲端管理系統 Demo",
  description: "Jvision 車廠雲端管理系統，提供預約、工單、報價、零件庫存、LINE 通知、結帳與營收分析的完整互動 Demo。",
  openGraph: {
    title: "Jvision 車廠雲端管理系統 Demo",
    description: "從進廠預約到工單結帳，一站式測試 Jvision 汽修廠雲端管理流程。",
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-field-route">
        {children}
      </body>
    </html>
  );
}
