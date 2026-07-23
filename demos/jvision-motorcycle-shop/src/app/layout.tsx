import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 機車行管理 Demo",
  description: "Jvision 機車行管理平台，展示客戶車籍、維修保養單、零件庫存、付款沖銷、報表列印與毛利分析流程。",
  openGraph: {
    title: "Jvision 機車行管理 Demo",
    description: "可互動測試的機車行維修與庫存管理平台。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
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
