import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 牙科診所智能助理 Demo",
  description:
    "Jvision 牙科診所智能助理 Demo，整合線上預約、患者管理、約診提醒、術後追蹤、定檢通知、評價追蹤與診所績效分析。",
  openGraph: {
    title: "Jvision 牙科診所智能助理 Demo",
    description: "可操作的牙科診所工作台展示，支援預約排程、患者 CRM、提醒通知、回診追蹤與 AI 摘要。",
    images: ["https://www.jvision-ai.com/public/logo.png"]
  }
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
