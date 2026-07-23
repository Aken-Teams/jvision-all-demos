import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jvision Maintenance Demo",
  description: "Jvision 智慧設備維護與預防保養 Demo"
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
