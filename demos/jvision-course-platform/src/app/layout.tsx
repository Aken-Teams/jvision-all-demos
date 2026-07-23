import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 線上課程平台 Demo",
  description: "Jvision 線上課程、銷售頁、金流、影音串流、作業互動與學員管理 demo。",
  openGraph: {
    title: "Jvision 線上課程平台 Demo",
    description: "立即體驗課程建立、銷售頁、折扣結帳、影音單元、作業回饋與學員管理。",
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-learning-studio">
        {children}
      </body>
    </html>
  );
}
