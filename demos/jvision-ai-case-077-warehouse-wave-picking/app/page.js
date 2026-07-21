import Script from "next/script";
import { demoConfig, mainClass, mainContent, systemPreset } from "./demo-data";

const bootstrapCode = `window.DEMO_CONFIG = ${JSON.stringify(demoConfig)};\nwindow.SYSTEM_PRESET = ${JSON.stringify(systemPreset)};`;

export const dynamic = "force-static";

export default function DemoPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: bootstrapCode }} />
      <main className={mainClass} dangerouslySetInnerHTML={{ __html: mainContent }} />
      <Script src="./demo-app.js" strategy="afterInteractive" />
    </>
  );
}
