"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "../data/products";
import repositoryDates from "../data/repository-dates.json";

const tones = ["coral", "teal", "blue", "amber", "violet", "green"];
const repositoryDateMap = repositoryDates as Record<string, { created_at: string; pushed_at: string }>;

function getRepositoryDates(product: Product) {
  return repositoryDateMap[product.githubUrl.replace(/\/$/, "").toLowerCase()];
}

function getModuleMark(product: Product) {
  const words = product.module.toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  if (words.length > 1) return words.map((word) => word[0]).join("").slice(0, 3);
  if (words.length === 1) return words[0].slice(0, 3);
  return [...product.name.replace(/\s/g, "")].slice(0, 2).join("");
}
const categoryStyles: Record<string, { tone: string; mark: string }> = {
  "製造與工程": { tone: "teal", mark: "製" },
  "協作與管理": { tone: "green", mark: "協" },
  "ESG 與永續": { tone: "amber", mark: "綠" },
  "金融與保險": { tone: "violet", mark: "財" },
  "企業營運": { tone: "coral", mark: "營" },
  "教育與照護": { tone: "blue", mark: "學" },
  "交通與車輛": { tone: "blue", mark: "行" },
  "零售與服務": { tone: "coral", mark: "店" },
};

export function ShowcaseGallery({
  products,
  categories,
  initialCategory = "全部",
}: {
  products: Product[];
  categories: string[];
  initialCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("recommended");
  const [pageSize, setPageSize] = useState(12);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [posterProduct, setPosterProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!posterProduct) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPosterProduct(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [posterProduct]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("zh-TW");
    return products.filter((product) => {
      const categoryMatch = category === "全部" || product.category === category;
      const text = `${product.name} ${product.module} ${product.description}`.toLocaleLowerCase("zh-TW");
      return categoryMatch && (!needle || text.includes(needle));
    });
  }, [category, products, query]);

  const sortedProducts = useMemo(() => {
    if (sort === "newest") return [...filtered].sort((left, right) => {
      const leftDate = getRepositoryDates(left)?.created_at;
      const rightDate = getRepositoryDates(right)?.created_at;
      return (rightDate ? Date.parse(rightDate) : right.id) - (leftDate ? Date.parse(leftDate) : left.id);
    });
    if (sort === "updated") return [...filtered].sort((left, right) => {
      const leftDate = getRepositoryDates(left)?.pushed_at;
      const rightDate = getRepositoryDates(right)?.pushed_at;
      return (rightDate ? Date.parse(rightDate) : right.id) - (leftDate ? Date.parse(leftDate) : left.id);
    });
    if (sort === "name") return [...filtered].sort((left, right) => left.name.localeCompare(right.name, "zh-TW"));
    if (sort === "category") return [...filtered].sort((left, right) => left.category.localeCompare(right.category, "zh-TW") || left.name.localeCompare(right.name, "zh-TW"));
    return filtered;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const visibleProducts = sortedProducts.slice((page - 1) * pageSize, page * pageSize);
  function formatDate(value?: string) {
    if (!value) return "";
    return new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
  }

  function isRecent(value?: string) {
    return Boolean(value) && Date.now() - new Date(value as string).getTime() < 45 * 24 * 60 * 60 * 1000;
  }

  function goToPage(nextPage: number) {
    setPage(nextPage);
    document.querySelector(".result-row")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="explore" id="gallery">
        <div className="explore-heading">
          <div>
            <p className="eyebrow">探索 Demo</p>
            <h2>找到適合你的數位工作方式</h2>
          </div>
          <p>從產業、部門或工作情境開始搜尋，每一張卡片都能直接進入可操作的正式 Demo。</p>
        </div>

        <div className="filter-panel">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="搜尋系統、功能或產業，例如：人資、庫存、照護"
              aria-label="搜尋 Demo"
            />
          </label>
          <div className="category-list" aria-label="Demo 分類">
            {["全部", ...categories].map((item) => (
              <button
                type="button"
                className={category === item ? "active" : ""}
                onClick={() => {
                  setCategory(item);
                  setPage(1);
                }}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="result-row">
          <div><strong>{filtered.length} 個 Demo</strong><span>第 {page} / {totalPages} 頁 · {category === "全部" ? "顯示所有分類" : `目前分類：${category}`}</span></div>
          <div className="result-controls">
            <div className="view-switch" aria-label="顯示方式">
              <button type="button" className={viewMode === "cards" ? "active" : ""} onClick={() => setViewMode("cards")} aria-pressed={viewMode === "cards"}>卡片</button>
              <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-pressed={viewMode === "list"}>列表</button>
            </div>
            <label>排序
              <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
                <option value="recommended">推薦排序</option>
                <option value="newest">最近新增</option>
                <option value="updated">最近更新</option>
                <option value="name">名稱 A–Z</option>
                <option value="category">依分類</option>
              </select>
            </label>
            <label>每頁
              <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                <option value={12}>12 個</option>
                <option value={24}>24 個</option>
                <option value={60}>全部</option>
              </select>
            </label>
          </div>
        </div>

        {filtered.length ? (
          <>
            <div className={`gallery-grid ${viewMode === "list" ? "list-view" : ""}`}>
              {visibleProducts.map((product) => {
                const dates = getRepositoryDates(product);
                return (
                <article className="demo-card" data-slug={product.slug} key={product.slug}>
                  <div className="card-main">
                    <div className={`card-visual visual-pattern-${product.id % 4} tone-${categoryStyles[product.category]?.tone || tones[(product.id - 1) % tones.length]}`}>
                      <span>{product.category}</span>
                      <b>{String(product.id).padStart(2, "0")}</b>
                      <strong>{product.name}</strong>
                      <i aria-hidden="true">{getModuleMark(product)}</i>
                    </div>
                    <div className="card-copy">
                      <div className="card-meta">
                        <span>{product.category}{isRecent(dates?.created_at) ? <b className="recent-badge">最近新增</b> : null}</span>
                      </div>
                      <h3>{product.name}</h3>
                      <p>{product.description.replace(/ Demo$/i, "")}</p>
                      <small>{product.module}</small>
                      {dates?.pushed_at ? <time dateTime={dates.pushed_at}>{dates.created_at ? `新增於 ${formatDate(dates.created_at)} · ` : ""}更新於 {formatDate(dates.pushed_at)}</time> : null}
                    </div>
                  </div>
                  <div className="card-actions">
                    <button type="button" className="poster-button" onClick={() => setPosterProduct(product)}>
                      查看海報
                    </button>
                    <a className="github-button" href={product.githubUrl}>
                      GitHub <span aria-hidden="true">↗</span>
                    </a>
                    <a className="open-demo" href={product.demoUrl}>
                      進入 Demo <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </article>
              );})}
            </div>
            {totalPages > 1 ? (
              <nav className="pagination" aria-label="Demo 分頁">
                <button type="button" className="page-direction" disabled={page === 1} onClick={() => goToPage(page - 1)}>← 上一頁</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    type="button"
                    className={page === pageNumber ? "active" : ""}
                    aria-current={page === pageNumber ? "page" : undefined}
                    onClick={() => goToPage(pageNumber)}
                    key={pageNumber}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button type="button" className="page-direction" disabled={page === totalPages} onClick={() => goToPage(page + 1)}>下一頁 →</button>
              </nav>
            ) : null}
          </>
        ) : (
          <div className="empty-state">
            <strong>目前找不到符合的 Demo</strong>
            <p>可以換一個關鍵字，或切回「全部」分類。</p>
            <button type="button" onClick={() => { setQuery(""); setCategory("全部"); setPage(1); }}>清除篩選</button>
          </div>
        )}
      </section>

      {posterProduct ? (
        <div
          className="poster-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setPosterProduct(null);
          }}
        >
          <section className="poster-dialog" role="dialog" aria-modal="true" aria-label={`${posterProduct.name} 產品海報`}>
            <div className="poster-dialog-header">
              <div><span>產品海報</span><strong>{posterProduct.name}</strong></div>
              <button type="button" onClick={() => setPosterProduct(null)} aria-label="關閉海報">×</button>
            </div>
            <div className="poster-dialog-body">
              <img src={posterProduct.posterUrl || `/posters/${posterProduct.slug}.png`} alt={`${posterProduct.name} 產品海報`} width="1240" height="1754" />
            </div>
            <div className="poster-dialog-actions">
              <button type="button" onClick={() => setPosterProduct(null)}>返回展示館</button>
              <a className="poster-github-link" href={posterProduct.githubUrl}>查看 GitHub <span aria-hidden="true">↗</span></a>
              <a href={posterProduct.demoUrl}>進入 Demo <span aria-hidden="true">↗</span></a>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
