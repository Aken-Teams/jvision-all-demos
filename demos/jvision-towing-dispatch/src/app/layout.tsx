import type { Metadata } from "next";
import "./globals.css";

import "./jvision-analytics.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://jvision-towing-dispatch.vercel.app"),
  title: "Jvision 拖吊派遣與車隊管理平台",
  description:
    "整合拖吊接單、道路救援派遣、司機任務、車隊狀態、扣車管理、帳務收款與 AI 摘要的 Demo。",
  openGraph: {
    title: "Jvision 拖吊派遣與車隊管理平台",
    description: "拖吊公司、道路救援、車輛運送與保管場可直接操作的調度 Demo。",
    images: ["/marketing/jvision-towing-dispatch-poster.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
              <script src="/jvision-analytics.js" defer />
      </body>
    </html>
  );
}
