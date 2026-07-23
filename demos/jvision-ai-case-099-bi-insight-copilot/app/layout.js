import "./globals.css";
import "./jvision-dynamic-charts.css";
import "./jvision-analytics.css";
import { bodyClass, pageMetadata } from "./demo-data";

export const metadata = pageMetadata;

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body className={bodyClass}>{children}        <script src="/jvision-analytics.js" defer />
              <script src="/jvision-dynamic-charts.js?v=20260723" defer />
      </body>
    </html>
  );
}
