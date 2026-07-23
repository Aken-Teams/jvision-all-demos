import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision Demo 展示館",
  description: "探索 Jvision 互動系統 Demo，依照產業、部門與工作情境快速找到適合的數位解決方案。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-learning-studio">
        {children}
      </body>
    </html>
  );
}
