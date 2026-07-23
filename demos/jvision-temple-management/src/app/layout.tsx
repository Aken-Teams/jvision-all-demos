import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 智慧廟務管理平台",
  description: "信徒資料、點燈牌位、法會報名、捐款收據與 AI 廟務摘要 Demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-community-altar">{children}
</body>
    </html>
  );
}
