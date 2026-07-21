import { ShowcaseGallery } from "../components/showcase-gallery";
import { getManagedProducts } from "../lib/products-store";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

type HomeProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: HomeProps) {
  const products = (await getManagedProducts()).filter((product) => product.visible !== false);
  const categories = Array.from(new Set(products.map((product) => product.category)));
  const params = await searchParams;
  const requestedCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const initialCategory = requestedCategory && categories.includes(requestedCategory)
    ? requestedCategory
    : "全部";

  const showcaseNames = ["人資薪酬招募管理", "生產工單", "理賠案件管理平台", "ESG 能源與碳管理平台"];
  const showcase = showcaseNames
    .map((name) => products.find((product) => product.name === name))
    .filter((product) => product !== undefined);

  return (
    <main className="curator-page">
      <div className="curator-shell">
        <header className="curator-header">
          <a className="curator-brand" href="#top" aria-label="Jvision Demo 展示館">
            <img src={logoUrl} alt="JVision" />
            <span><strong>Jvision Demo 展示館</strong><small>Interactive Product Collection</small></span>
          </a>
          <nav aria-label="主要導覽">
            <div className="curator-nav-links">
              <a href="#gallery">分類</a>
              <a href="#gallery">全部 Demo</a>
              <a href="https://github.com/yunghua817">我的 GitHub ↗</a>
              <a className="curator-admin-link" href="/admin">管理後台</a>
              <a className="curator-nav-action" href="#gallery">開始探索</a>
            </div>
            <details className="curator-mobile-menu">
              <summary>選單</summary>
              <div>
                <a href="#gallery">分類探索</a>
                <a href="#gallery">全部 Demo</a>
                <a href="https://github.com/yunghua817">我的 GitHub ↗</a>
                <a href="/admin">管理後台</a>
                <a className="curator-nav-action" href="#gallery">開始探索</a>
              </div>
            </details>
          </nav>
        </header>

        <div className="curator-stage">
          <section className="curator-hero" id="top">
            <span className="curator-label">{products.length} 個互動展示 · {categories.length} 個應用分類</span>
            <h1>探索 Jvision 的每一套系統</h1>
            <p>從產業情境出發，看見系統如何真正運作。選一個感興趣的展品，直接進入 Demo 體驗。</p>
            <div className="curator-actions">
              <a href="#showcase">看看精選系統</a>
              <a href="#gallery">依分類探索</a>
            </div>
          </section>

          <section className="curator-showcase" id="showcase" aria-label="精選 Demo">
            {showcase.map((product, index) => (
              <a className={`curator-piece piece-${index + 1}`} href={product.demoUrl} key={product.slug}>
              <div className="piece-copy">
                <div className="piece-top"><span>{product.category}</span><small>0{index + 1}</small></div>
                <div className="piece-content">
                  <strong>{product.name}</strong>
                  <p>{product.description}</p>
                </div>
                <div className="piece-footer"><span>{product.module}</span><b>進入 Demo ↗</b></div>
              </div>
              <div className="piece-preview" aria-hidden="true">
                <div className={`piece-infographic infographic-${index + 1}`}>
                  <div className="infographic-head">
                    <span>{["人力概況", "今日排程", "案件營運", "永續指標"][index]}</span>
                    <small>LIVE</small>
                  </div>
                  {index === 0 && (
                    <>
                      <div className="infographic-kpis three"><span><small>員工</small><b>3</b></span><span><small>月薪資</small><b>232K</b></span><span><small>招募中</small><b>3</b></span></div>
                      <div className="infographic-note"><b>AI</b><span>本週完成 3 筆招募追蹤</span></div>
                    </>
                  )}
                  {index === 1 && (
                    <div className="infographic-bars"><span><small>待排產</small><i style={{ width: "52%" }}></i><b>8</b></span><span><small>生產中</small><i style={{ width: "86%" }}></i><b>14</b></span><span><small>品檢中</small><i style={{ width: "38%" }}></i><b>5</b></span><span><small>準交率</small><i style={{ width: "93%" }}></i><b>93%</b></span></div>
                  )}
                  {index === 2 && (
                    <>
                      <div className="infographic-primary"><small>進行中案件</small><strong>42</strong><span>較上週 +8%</span></div>
                      <div className="infographic-kpis three compact"><span><small>新報案</small><b>7</b></span><span><small>平均天數</small><b>4.6</b></span><span><small>待補件</small><b>6</b></span></div>
                    </>
                  )}
                  {index === 3 && (
                    <>
                      <div className="infographic-kpis three"><span><small>排放量</small><b>29.62</b></span><span><small>即時用電</small><b>314</b></span><span><small>節能</small><b>13%</b></span></div>
                      <div className="infographic-bars compact"><span><small>直接排放</small><i style={{ width: "36%" }}></i></span><span><small>外購能源</small><i style={{ width: "78%" }}></i></span><span><small>供應鏈</small><i style={{ width: "24%" }}></i></span></div>
                    </>
                  )}
                </div>
              </div>
              </a>
            ))}
          </section>
        </div>

      </div>

      <ShowcaseGallery products={products} categories={categories} initialCategory={initialCategory} />

      <footer>
        <div><img src={logoUrl} alt="JVision" /><strong>Jvision Demo 展示館</strong></div>
        <span>{products.length} 套可操作的 Jvision 系統展示 · <a href="/admin">管理後台</a></span>
      </footer>
    </main>
  );
}
