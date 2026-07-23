import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision 法律案件管理 Demo",
  description: "Jvision 法律案件、庭期、待辦、工時、提醒通知與請款管理互動展示。",
  openGraph: {
    title: "Jvision 法律案件管理 Demo",
    description: "線上測試案件管理、庭期提醒、待辦回報、工時紀錄與請款流程。",
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
      <body className="jvision-bright-saas jvision-next-legacy jv-galaxy-saas jv-galaxy-revenue-lift">
        {children}
      </body>
    </html>
  );
}
