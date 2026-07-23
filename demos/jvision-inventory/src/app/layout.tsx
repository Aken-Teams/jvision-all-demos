import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision Inventory Demo",
  description: "Jvision 智慧庫存與倉儲管理 Demo"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-revenue-lift">
        {children}
      </body>
    </html>
  );
}
