import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 課程學習整合平台",
  description: "整合課程工具平台與線上課程平台的互動 Demo",
  openGraph: {
    title: "Jvision 課程學習整合平台",
    description: "課程上架、預約購課、候補劃位、影音單元、學員進度與 AI 營運摘要 Demo。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
