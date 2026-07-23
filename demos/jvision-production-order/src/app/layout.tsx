import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 生產工單管理 Demo",
  description: "Jvision 生產工單管理平台，展示訂單轉工單、排產派工、現場回報、品檢入庫與 AI 摘要。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-factory-command">
        {children}
      </body>
    </html>
  );
}
