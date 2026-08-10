import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JVision 人力派遣管理 Demo",
  description: "從缺工、資格媒合、派工確認，到出勤、薪資與請款的一站式人力派遣情境。",
  openGraph: {
    title: "JVision 人力派遣管理 Demo",
    description: "互動體驗明日缺工的資格媒合與派工確認流程。",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
