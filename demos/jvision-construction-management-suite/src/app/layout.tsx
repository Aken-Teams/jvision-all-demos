import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 營建工程整合平台",
  description: "整合營建工程、營建工程管理、估價與工程管理的互動 Demo",
  openGraph: {
    title: "Jvision 營建工程整合平台",
    description: "工程估價、報價簽核、轉專案、工地日報、品質安衛、材料成本、估驗請款與 AI 摘要 Demo。",
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
