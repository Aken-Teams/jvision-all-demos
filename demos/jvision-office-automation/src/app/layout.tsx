import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 企業協同辦公平台 Demo",
  description:
    "Jvision 企業協同辦公平台 Demo，整合流程簽核、內容門戶、資料中心、服務管理、AI 助手與行動辦公。",
  openGraph: {
    title: "Jvision 企業協同辦公平台 Demo",
    description: "可操作的 Jvision OA 協同辦公平台展示，支援流程、文件、公告、會議、資產與 AI 摘要。",
    images: ["https://www.jvision-ai.com/public/logo.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-people-workspace">
        {children}
      </body>
    </html>
  );
}
