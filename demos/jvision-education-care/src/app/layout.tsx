import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "Jvision 幼教園務與安親管理平台",
  description: "招生 CRM、學童名冊、排課出勤、接送確認、收費提醒、電子聯絡簿與 AI 園務摘要 Demo",
  openGraph: {
    title: "Jvision 幼教園務與安親管理平台",
    description: "可互動展示的幼教與安親營運管理 Demo，整合園務、班務、家長溝通與收費流程。",
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
      <body>
        {children}
              <script src="/jvision-analytics.js" defer />
      </body>
    </html>
  );
}
