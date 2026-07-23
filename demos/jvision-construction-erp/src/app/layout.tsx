import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 營建 工程管理 Demo",
  description: "Jvision 營建 工程管理 專案管理、採購用料、出工、報價、合約成本與收款結算互動展示。",
  openGraph: {
    title: "Jvision 營建 工程管理 Demo",
    description: "線上測試工程案、材料進貨、工班出勤、報價合約與成本結算流程。",
    images: ["https://www.jvision-ai.com/public/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-site-blueprint">
        {children}
      </body>
    </html>
  );
}
