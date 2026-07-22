import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 課程工具 Demo",
  description: "Jvision 課程營運工具，提供排課同步、線上預約、購課劃位、電子合約與發票自動化的完整互動 Demo。",
  openGraph: {
    title: "Jvision 課程工具 Demo",
    description: "從排課、預約、劃位到簽約與發票，完整體驗 Jvision 場館課程營運流程。",
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
      <body>
        {children}
              <script src="/jvision-analytics.js" defer />
      </body>
    </html>
  );
}
