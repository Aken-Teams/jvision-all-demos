import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jvision-sign-shop-management.vercel.app"),
  title: "Jvision 招牌店務與工單管理平台",
  description:
    "整合銷售跟進、報價模板、製作工單、安裝排程、檔案管理與 AI 摘要的招牌店務 Demo。",
  openGraph: {
    title: "Jvision 招牌店務與工單管理平台",
    description: "招牌、廣告工程、輸出與車貼店可直接操作的店務管理 Demo。",
    images: ["/marketing/jvision-sign-shop-management-poster.png"],
  },
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
