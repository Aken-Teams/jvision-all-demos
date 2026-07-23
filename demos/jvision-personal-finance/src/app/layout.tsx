import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 個人財務管理 Demo",
  description: "Jvision 個人財務管理、帳戶資產、交易記帳、預算控管、帳單提醒與財務分析互動展示。",
  openGraph: {
    title: "Jvision 個人財務管理 Demo",
    description: "線上測試帳戶、交易、自動分類、預算、帳單提醒與資產分析流程。",
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
      </body>
    </html>
  );
}
