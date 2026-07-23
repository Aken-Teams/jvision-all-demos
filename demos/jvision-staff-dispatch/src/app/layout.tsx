import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/language-switcher";
import "./globals.css";

import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
export const metadata: Metadata = {
  title: "JVision HR",
  description: "Jvision 人力派遣管理平台，展示派遣員工建檔、客戶案場、派工出勤、工時登錄、薪資結算與請款報表流程。",
  openGraph: {
    title: "JVision HR",
    description: "可互動測試的人力派遣營運管理平台。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-supply-flow">
        <LanguageSwitcher />
        {children}
              <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
