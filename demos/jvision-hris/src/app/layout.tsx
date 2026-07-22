import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/language-switcher";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "JVision HR",
  description: "員工名冊、招募流程、薪資試算、請假核准與 AI 人資摘要 Demo",
  openGraph: {
    title: "JVision HR",
    description: "可互動展示的 HRIS Demo，整合員工資料、招募、薪酬、請假與 AI 摘要。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        <LanguageSwitcher />
        {children}
              <script src="/jvision-analytics.js" defer />
      </body>
    </html>
  );
}
