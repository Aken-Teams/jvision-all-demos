import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { LanguageSwitcher } from "@/components/language-switcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "JVision HR",
  description: "Jvision 雲端打卡、外勤回報、異常判斷、請假簽核、排班與工時計薪互動展示。",
  openGraph: {
    title: "JVision HR",
    description: "線上測試打卡、GPS 外勤、出勤異常、請假簽核與工時薪資計算流程。",
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
        <LanguageSwitcher />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
