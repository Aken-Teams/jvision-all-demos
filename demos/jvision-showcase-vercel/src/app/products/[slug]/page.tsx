import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "../../../data/products";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">
          <img src={logoUrl} alt="Jvision" />
          <span>
            <strong>Jvision Demo 展示館</strong>
            <small>系統介紹</small>
          </span>
        </Link>
        <nav><Link href="/">返回展示館</Link></nav>
      </header>

      <section className="detail-hero">
        <div>
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="detail-actions">
            <a className="primary-button" href={product.demoUrl}>進入 Demo</a>
            <Link className="secondary-button" href="/">返回展示館</Link>
          </div>
        </div>
        <div className="detail-panel">
          <span>系統模組</span>
          <strong>{product.module}</strong>
          <span>Demo 網址</span>
          <a href={product.demoUrl}>{product.demoUrl}</a>
        </div>
      </section>

      <section className="detail-content">
        <article>
          <h2>這套系統適合誰？</h2>
          <p>適合希望把分散作業集中管理、降低人工追蹤時間，並需要清楚掌握營運進度的團隊。</p>
        </article>
        <article>
          <h2>可以怎麼體驗？</h2>
          <p>點擊「進入 Demo」即可操作主要流程、查看範例資料與儀表板，快速理解實際使用情境。</p>
        </article>
      </section>
    </main>
  );
}
