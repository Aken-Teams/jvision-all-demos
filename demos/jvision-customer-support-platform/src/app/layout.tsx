import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 客服支援平台 Demo",
  description: "Jvision 客服支援平台，展示共享收件箱、AI 摘要與回覆、知識庫、支援入口、工作流程、主動訊息與客服報表流程。",
  openGraph: {
    title: "Jvision 客服支援平台 Demo",
    description: "可互動測試的客服收件箱、知識庫、AI 回覆與支援報表平台。",
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
