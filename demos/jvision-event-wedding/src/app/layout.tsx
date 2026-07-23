import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 活動會展與婚禮場地管理平台",
  description: "詢價、檔期、報價合約、訂金付款、賓客桌次、籌備任務與 AI 活動摘要 Demo",
  openGraph: {
    title: "Jvision 活動會展與婚禮場地管理平台",
    description: "可互動展示的活動籌備 Demo，整合詢價報價、活動任務、合約付款與 AI 摘要。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-clinical-calm">
        {children}
      </body>
    </html>
  );
}
