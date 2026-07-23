import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 貿易 ERP Demo",
  description: "Jvision 貿易 ERP，展示報價、銷售確認單、採購、裝箱單、商業發票、應收應付、出貨嘜頭與利潤分析流程。",
  openGraph: {
    title: "Jvision 貿易 ERP Demo",
    description: "可互動測試的進出口貿易報價、採購、出貨與帳款管理平台。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-factory-command">
        {children}
      </body>
    </html>
  );
}
