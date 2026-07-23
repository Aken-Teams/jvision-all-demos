import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision CRM Demo",
  description: "Jvision CRM 提供客戶管理、銷售管線、任務追蹤、活動紀錄與報表分析的完整互動 Demo。",
  openGraph: {
    title: "Jvision CRM Demo",
    description: "直接操作 Jvision CRM，測試客戶、商機、任務、管線與報表流程。",
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
