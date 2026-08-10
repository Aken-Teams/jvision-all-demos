import { StaffDispatchDemo } from "@/components/staff-dispatch-demo";

export default function Home() {
  return (
    <main className="dispatch-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="回 Demo 首頁">JVision</a>
        <div className="header-context">
          <span>人力派遣管理</span>
          <strong>明日早班缺工處理</strong>
        </div>
        <a className="hub-link" href="/">全部 Demo</a>
      </header>

      <StaffDispatchDemo />
    </main>
  );
}
