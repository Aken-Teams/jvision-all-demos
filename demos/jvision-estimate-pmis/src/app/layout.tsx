import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 估價與工程管理 Demo",
  description: "Jvision 估價與工程專案管理平台，展示報價估價、轉工程專案、進度品質、圖說送審、估驗請款與驗收維保流程。",
  openGraph: {
    title: "Jvision 估價與工程管理 Demo",
    description: "可互動測試的估價報價與工程 PMIS 合併管理平台。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-site-blueprint">
        {children}
      </body>
    </html>
  );
}
