import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 烘焙 POS 與前店後廠管理",
  description: "門市 POS、禮盒預購、庫存入出、中央廚房生產、報廢扣料與 AI 銷售摘要 Demo",
  openGraph: {
    title: "Jvision 烘焙 POS 與前店後廠管理",
    description: "可互動展示的烘焙門市與前店後廠管理 Demo，整合銷售、預購、庫存與產銷流程。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-guest-delight">
        {children}
      </body>
    </html>
  );
}
