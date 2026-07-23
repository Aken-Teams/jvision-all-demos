import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jvision-auto-glass-ops.vercel.app"),
  title: "Jvision 汽車玻璃維修與請款管理平台",
  description: "整合汽車玻璃預約、技師派工、玻璃訂購、客戶簽名、保險請款、收款與 AI 摘要的 Demo。",
  openGraph: {
    title: "Jvision 汽車玻璃維修與請款管理平台",
    description: "汽車玻璃店、行動安裝技師與保險請款團隊可直接操作的店務 Demo。",
    images: ["/marketing/jvision-auto-glass-ops-poster.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-field-route">
        {children}
      </body>
    </html>
  );
}
