"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "../data/products";

type Props = { initialProducts: Product[] };
type HealthInfo = { status: "checking" | "online" | "offline" | "unknown" };
type HealthFilter = "all" | "online" | "issues" | "checking";

const emptyProduct = (id: number): Product => ({
  id, name: "新 Demo", module: "", description: "", demoUrl: "https://",
  githubUrl: "https://github.com/yunghua817/", posterUrl: "", category: "企業營運",
  slug: `new-demo-${id}`, visible: true,
});

export function AdminDashboard({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id ?? 0);
  const [query, setQuery] = useState("");
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [health, setHealth] = useState<Record<string, HealthInfo>>({});
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedIndex = products.findIndex((product) => product.id === selectedId);
  const selected = products[selectedIndex];
  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((product) => {
      const textMatch = !keyword || `${product.name} ${product.category} ${product.module}`.toLowerCase().includes(keyword);
      const status = health[product.slug]?.status ?? "checking";
      const healthMatch = healthFilter === "all" || (healthFilter === "issues" ? status === "offline" || status === "unknown" : status === healthFilter);
      return textMatch && healthMatch;
    });
  }, [health, healthFilter, products, query]);

  const healthCounts = useMemo(() => products.reduce((counts, product) => {
    const status = health[product.slug]?.status ?? "checking";
    counts.all += 1;
    counts[status] += 1;
    if (status === "offline" || status === "unknown") counts.issues += 1;
    return counts;
  }, { all: 0, online: 0, offline: 0, unknown: 0, issues: 0, checking: 0 }), [health, products]);

  const productSlugKey = useMemo(() => products.map((product) => product.slug).join(","), [products]);

  useEffect(() => {
    if (!productSlugKey) return;
    const controller = new AbortController();
    const slugs = productSlugKey.split(",");
    setHealth((current) => ({
      ...current,
      ...Object.fromEntries(slugs.map((slug) => [slug, { status: "checking" as const }])),
    }));
    fetch("/api/demo-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("health check failed")))
      .then((data: { results: Record<string, HealthInfo> }) => {
        setHealth((current) => ({ ...current, ...data.results }));
        setLastCheckedAt(new Date());
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setHealth((current) => ({
            ...current,
            ...Object.fromEntries(slugs.map((slug) => [slug, { status: "unknown" as const }])),
          }));
        }
      });
    return () => controller.abort();
  }, [productSlugKey]);

  function selectHealthFilter(nextFilter: HealthFilter) {
    setHealthFilter(nextFilter);
    setQuery("");
    if (nextFilter === "all") return;
    const firstMatch = products.find((product) => {
      const status = health[product.slug]?.status ?? "checking";
      return nextFilter === "issues" ? status === "offline" || status === "unknown" : status === nextFilter;
    });
    if (firstMatch) setSelectedId(firstMatch.id);
  }

  function getHealthLabel(product: Product) {
    const status = health[product.slug]?.status ?? "checking";
    if (status === "online") return "正常";
    if (status === "offline") return "離線";
    if (status === "unknown") return "待確認";
    return "檢查中";
  }

  function updateSelected(field: keyof Product, value: string | boolean) {
    setProducts((current) => current.map((product) => product.id === selectedId ? { ...product, [field]: value } : product));
  }

  function addProduct() {
    const nextId = Math.max(0, ...products.map((product) => product.id)) + 1;
    setProducts((current) => [...current, emptyProduct(nextId)]);
    setSelectedId(nextId); setQuery(""); setMessage("已新增草稿，完成內容後請按儲存");
  }

  function removeProduct() {
    if (!selected || !window.confirm(`確定刪除「${selected.name}」？`)) return;
    const remaining = products.filter((product) => product.id !== selected.id);
    setProducts(remaining); setSelectedId(remaining[0]?.id ?? 0);
    setMessage("已從清單移除，按儲存後才會正式生效");
  }

  function moveSelected(direction: -1 | 1) {
    const destination = selectedIndex + direction;
    if (selectedIndex < 0 || destination < 0 || destination >= products.length) return;
    const reordered = [...products];
    [reordered[selectedIndex], reordered[destination]] = [reordered[destination], reordered[selectedIndex]];
    setProducts(reordered);
  }

  async function save() {
    setBusy(true); setMessage("儲存中…");
    const response = await fetch("/api/admin/products", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products }),
    });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? `已儲存 ${products.length} 個 Demo` : data.message || "儲存失敗");
    setBusy(false);
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div><span>Jvision Showcase</span><h1>Demo 管理後台</h1><p>共 {products.length} 個專案，變更後請按「儲存全部」。</p></div>
        <div className="admin-header-actions"><a href="/">← 返回展示館</a></div>
      </header>
      <section className="health-overview admin-health-overview" aria-labelledby="admin-health-title">
        <div className="health-overview-heading">
          <div><span>內部維運</span><strong id="admin-health-title">Demo 網址健康總覽</strong></div>
          <small aria-live="polite">{lastCheckedAt ? `最後檢查 ${lastCheckedAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}` : "正在檢查全部網址"}</small>
        </div>
        <div className="health-summary-grid">
          <button type="button" className={`health-summary-card summary-all ${healthFilter === "all" ? "active" : ""}`} onClick={() => selectHealthFilter("all")} aria-pressed={healthFilter === "all"}>
            <span>全部 Demo</span><strong>{healthCounts.all}</strong><small>完整專案清單</small>
          </button>
          <button type="button" className={`health-summary-card summary-online ${healthFilter === "online" ? "active" : ""}`} onClick={() => selectHealthFilter("online")} aria-pressed={healthFilter === "online"}>
            <span>正常上線</span><strong>{healthCounts.online}</strong><small>網址可正常開啟</small>
          </button>
          <button type="button" className={`health-summary-card summary-issues ${healthFilter === "issues" ? "active" : ""}`} onClick={() => selectHealthFilter("issues")} aria-pressed={healthFilter === "issues"}>
            <span>異常 Demo</span><strong>{healthCounts.issues}</strong><small>離線 {healthCounts.offline} · 待確認 {healthCounts.unknown}</small>
          </button>
          <button type="button" className={`health-summary-card summary-checking ${healthFilter === "checking" ? "active" : ""}`} onClick={() => selectHealthFilter("checking")} aria-pressed={healthFilter === "checking"}>
            <span>檢查中</span><strong>{healthCounts.checking}</strong><small>等待網址回應</small>
          </button>
        </div>
      </section>
      <div className="admin-workspace">
        <aside className="admin-list-panel">
          <div className="admin-list-tools"><input aria-label="搜尋 Demo" placeholder="搜尋名稱、分類或模組" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" onClick={addProduct}>＋ 新增 Demo</button></div>
          <div className="admin-product-list">
            {filteredProducts.map((product) => (
              <button type="button" className={product.id === selectedId ? "is-active" : ""} onClick={() => setSelectedId(product.id)} key={product.id}>
                <span>{product.name}<small>{product.category}</small></span>
                <span className="admin-list-badges"><i className={`health-${health[product.slug]?.status ?? "checking"}`}>{getHealthLabel(product)}</i><i className={product.visible === false ? "is-hidden" : ""}>{product.visible === false ? "隱藏" : "公開"}</i></span>
              </button>
            ))}
          </div>
        </aside>
        <section className="admin-editor">
          {selected ? <>
            <div className="admin-editor-title"><div><span>編輯 Demo #{selected.id}</span><h2>{selected.name}</h2></div><div><button type="button" onClick={() => moveSelected(-1)} disabled={selectedIndex === 0}>↑ 上移</button><button type="button" onClick={() => moveSelected(1)} disabled={selectedIndex === products.length - 1}>↓ 下移</button></div></div>
            <div className="admin-form-grid">
              <label>專案名稱<input value={selected.name} onChange={(event) => updateSelected("name", event.target.value)} /></label>
              <label>分類<input value={selected.category} onChange={(event) => updateSelected("category", event.target.value)} /></label>
              <label>英文模組名稱<input value={selected.module} onChange={(event) => updateSelected("module", event.target.value)} /></label>
              <label>網址代稱（slug）<input value={selected.slug} onChange={(event) => updateSelected("slug", event.target.value)} /></label>
              <label className="admin-field-wide">簡短說明<textarea rows={3} value={selected.description} onChange={(event) => updateSelected("description", event.target.value)} /></label>
              <label className="admin-field-wide">Demo 網址<input type="url" value={selected.demoUrl} onChange={(event) => updateSelected("demoUrl", event.target.value)} /></label>
              <label className="admin-field-wide">GitHub 網址<input type="url" value={selected.githubUrl} onChange={(event) => updateSelected("githubUrl", event.target.value)} /></label>
              <label className="admin-field-wide">海報網址（可留白使用內建海報）<input value={selected.posterUrl || ""} onChange={(event) => updateSelected("posterUrl", event.target.value)} placeholder="/posters/example.png 或 https://…" /></label>
            </div>
            <label className="admin-visibility"><input type="checkbox" checked={selected.visible !== false} onChange={(event) => updateSelected("visible", event.target.checked)} /><span><strong>公開顯示</strong><small>關閉後，這個 Demo 不會出現在公開展示館。</small></span></label>
            <div className="admin-editor-footer"><button type="button" className="admin-delete" onClick={removeProduct}>刪除這個 Demo</button><button type="button" className="admin-save" onClick={save} disabled={busy}>{busy ? "處理中…" : "儲存全部變更"}</button></div>
            {message && <div className="admin-status" aria-live="polite">{message}</div>}
          </> : <div className="admin-empty">請從左側選擇 Demo，或新增一筆資料。</div>}
        </section>
      </div>
    </main>
  );
}
