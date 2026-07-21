import { PetBookingDemo } from "@/components/pet-booking-demo";

const services = [
  ["寵物安親", "09:00-19:00 日間照護、活動紀錄、餵食提醒與接送備註。", "NT$ 780 / 日"],
  ["寵物美容", "洗澡、修剪、皮毛狀態紀錄與加購護理方案。", "NT$ 1,200 / 次"],
  ["寵物旅館", "入住排房、夜間巡房、個別餵食與家長即時回報。", "NT$ 1,500 / 晚"],
  ["健康課程", "體態管理、營養諮詢、活動課程與照護建議。", "NT$ 600 / 堂"],
];

const products = [
  ["舒眠毯", "入住加購，讓毛孩更快適應環境", "NT$ 480"],
  ["健康鮮食", "依體型與過敏需求配置", "NT$ 180"],
  ["玩具組", "安親活動使用，也可帶回家", "NT$ 320"],
  ["護毛精華", "美容後加購護理", "NT$ 260"],
];

const spaces = [
  "分區活動室",
  "貓咪跳台區",
  "單獨休息房",
  "美容護理室",
  "戶外散步紀錄",
  "營養師照護",
];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含預約、加購、入住狀態、照護紀錄與通知流程。"],
  ["手機可以使用嗎？", "可以。介面已做 RWD，手機會改成單欄預約與管理工作台。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#services">服務方案</a>
          <a href="#products">加購商品</a>
          <a href="#demo">預約 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立刻預約</a>
      </header>

      <section className="hero pet-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Pet Service Booking</p>
          <h1>寵物旅館、安親、美容與課程，都能在同一頁完成預約。</h1>
          <p className="hero-text">
            Jvision 讓寵物服務業者快速建立一頁式預約頁，整合服務時段、入住需求、商品加購、照護紀錄與家長通知，
            讓毛孩家長安心預約，也讓櫃台與照護團隊同步掌握每一筆服務。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">測試預約流程</a>
            <a className="secondary-button" href="#services">查看服務</a>
          </div>
        </div>

        <div className="booking-preview" aria-label="Jvision pet booking preview">
          <div className="preview-photo">
            <img
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80"
              alt="寵物旅館中的狗狗"
            />
            <span>今日可預約 8 個時段</span>
          </div>
          <div className="preview-panel">
            <strong>Jvision 寵物照護中心</strong>
            <p>安親、美容、旅館、課程</p>
            <div>
              <span>入住率</span>
              <b>76%</b>
            </div>
            <div>
              <span>今日預約</span>
              <b>24 筆</b>
            </div>
            <div>
              <span>待通知家長</span>
              <b>5 筆</b>
            </div>
          </div>
        </div>
      </section>

      <section className="services" id="services">
        <div className="section-heading">
          <p className="eyebrow">方案類別</p>
          <h2>把常見寵物服務包成清楚、好預約、好管理的方案。</h2>
        </div>
        <div className="service-grid">
          {services.map(([title, text, price]) => (
            <article className="service-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
              <strong>{price}</strong>
              <a href="#demo">立即預約</a>
            </article>
          ))}
        </div>
      </section>

      <section className="products" id="products">
        <div className="section-heading">
          <p className="eyebrow">精選商品</p>
          <h2>預約時同步加購，櫃台、庫存與照護備註一起更新。</h2>
        </div>
        <div className="product-grid">
          {products.map(([title, text, price]) => (
            <article className="product-card" key={title}>
              <div className="product-visual" />
              <h3>{title}</h3>
              <p>{text}</p>
              <strong>{price}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="space-band">
        <div className="section-heading">
          <p className="eyebrow">舒適環境</p>
          <h2>讓每個空間、團隊與照護紀錄，都變成家長看得懂的安心訊息。</h2>
        </div>
        <div className="space-grid">
          {spaces.map((space) => (
            <span key={space}>{space}</span>
          ))}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>直接測試預約、商品加購、入住排房與照護通知。</h2>
          <p>
            可新增預約、選服務、填寫毛孩資料、加入加購商品、更新入住狀態，並產生家長通知紀錄。
          </p>
        </div>
        <PetBookingDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">使用者見證</p>
          <h2>家長最在意的不是功能多，而是每次照護都有回覆、有紀錄。</h2>
        </div>
        <div className="review-grid">
          {[
            ["出差寄宿很放心", "每天都收到照片與餵食紀錄，接回家時狀態也很好。", "抹茶家長 Jason"],
            ["美容預約很順", "可以直接選時段與加購護毛，櫃台確認也很快。", "Momo 家長 Kelly"],
            ["安親紀錄清楚", "活動、散步、用餐都看得到，長期照護很安心。", "BOBO 家長 Anna"],
          ].map(([title, text, name]) => (
            <article className="review-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
              <strong>{name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="faq" id="faq">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h2>常見問題</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 寵物服務預約 Demo，示範一頁式預約、加購、入住與照護通知流程。</p>
      </footer>
    </main>
  );
}
