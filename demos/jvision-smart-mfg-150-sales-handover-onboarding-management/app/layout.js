import "./globals.css";
import { bodyClass, pageMetadata } from "./demo-data";

export const metadata = pageMetadata;

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body className={bodyClass}>{children}</body>
    </html>
  );
}
