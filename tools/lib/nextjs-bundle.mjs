/**
 * 把一套實例的單檔 index.html 轉成一個真正的 Next.js 專案。
 *
 * ── 為什麼不直接改編輯產線 ──
 * 單檔 HTML 是整條產線的共同語言：codex 改的是它、版本存的是它、
 * static-gate 驗的是它、jv-live 靠它的 <th> 文字綁資料。把來源換成 Next.js
 * 等於把上面每一件事都重寫一次。所以 Next.js 是**部署時的產出**，
 * 來源仍然是那一份 HTML——改一個地方，不是改五個。
 *
 * ── 轉出來的東西 ──
 *   app/layout.jsx           <head> 那些東西 + globals.css
 *   app/globals.css          原本的 <style> 全部搬過來
 *   app/page.jsx             render 版面骨架
 *   app/boot.jsx             "use client"，照順序把原本的 script 掛回去
 *   app/api/schema/route.js  取代原本 vercel.json 的 rewrite
 *   app/api/t/[table]/...    真正的路由，不再用 query 參數假裝
 *
 * ── 兩件實測踩到的事 ──
 * 一、App Router 會把底線開頭的資料夾當成「私有資料夾」排除在路由外，
 *     所以 app/_jv/schema/route.js 不會變成路由。live.js 打的是 ./_jv/schema，
 *     那條路徑不能改（改了等於改動所有實例的 runtime），所以用 next.config
 *     的 rewrite 導過去。public/_jv/ 底下的靜態檔不受這條規則影響。
 * 二、React 不會執行 dangerouslySetInnerHTML 裡面的 <script>，而 next/script
 *     的 afterInteractive 不保證載入順序。原本的頁面是 chart.js → 版面 JS →
 *     live.js 這種有先後的關係，順序錯了圖表會畫不出來而且不會報錯。
 *     所以自己依序載，載完一支再載下一支。
 */
import fs from "node:fs";
import path from "node:path";

/* ── 從單檔 HTML 拆出各個部分 ──────────────────────── */
export function dissect(html) {
  const pick = (re) => { const m = html.match(re); return m ? m[1] : ""; };
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n\n");

  /* 外部 script 依出現順序收集，內嵌的合併成一支檔案。順序就是原本的
     文件順序——chart.js 在前、版面 JS 在後，這個先後關係要原封不動保留。 */
  const scripts = [];
  let inline = "";
  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const src = (m[1].match(/\bsrc=["']([^"']+)["']/i) || [])[1];
    if (src) scripts.push({ src });
    else if (m[2].trim()) { scripts.push({ inline: true, at: inline.length }); inline += m[2] + "\n;\n"; }
  }

  let body = pick(/<body[^>]*>([\s\S]*)<\/body>/i) || html;
  body = body.replace(/<script[\s\S]*?<\/script>/gi, "");

  return {
    lang: pick(/<html[^>]*\blang=["']([^"']+)["']/i) || "zh-Hant",
    title: pick(/<title[^>]*>([\s\S]*?)<\/title>/i).trim(),
    description: pick(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i),
    bodyClass: pick(/<body[^>]*\bclass=["']([^"']*)["']/i),
    links: [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]),
    styles, scripts, inline, body,
  };
}

/* ── 產生檔案 ──────────────────────────────────────── */
const jsonAttr = (s) => JSON.stringify(s);

function layoutJsx(d) {
  /* 字型與 icon 的 <link> 直接照搬。Next 的字型最佳化要改寫 CSS 裡的
     font-family，而那些 CSS 是客戶的頁面自己寫的，動了就可能對不上。 */
  const links = d.links.filter((l) => !/rel=["']icon["']/i.test(l))
    .map((l) => "      " + l.replace(/>$/, " />").replace(/\/\s*\/>$/, " />")).join("\n");
  return `import "./globals.css";

export const metadata = {
  title: ${jsonAttr(d.title || "系統")},
  description: ${jsonAttr(d.description || "")},
  icons: { icon: "/_jv/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang=${jsonAttr(d.lang)}>
      <head>
${links}
      </head>
      <body${d.bodyClass ? ` className=${jsonAttr(d.bodyClass)}` : ""}>{children}</body>
    </html>
  );
}
`;
}

function pageJsx(d) {
  /* ./_jv/live.js 這種相對路徑是相對於「網頁的網址」解析的。首頁在 / 時剛好
     等於 /_jv/live.js，但只要頁面被掛在子路徑底下就會整個對不到，而且是
     靜靜地 404。轉成絕對路徑，跟頁面掛在哪裡無關。 */
  const abs = (u) => (/^(https?:)?\/\//.test(u) ? u : "/" + String(u).replace(/^\.?\//, ""));
  const list = d.scripts.map((s) => jsonAttr(s.src ? abs(s.src) : "/_jv/page.js"));
  return `import Boot from "./boot";

/* 版面骨架直接沿用原本的 HTML。這一頁的互動是由 /_jv 底下那幾支
   原生 JS 接手的，不是 React 元件——把它們硬拆成 JSX 只會讓
   「客戶用講的改系統」那條路多一層翻譯，改壞的機會反而變高。 */
const MARKUP = ${JSON.stringify(d.body)};

const SCRIPTS = [
${list.map((s) => "  " + s).join(",\n")}
];

export default function Page() {
  return <Boot markup={MARKUP} scripts={SCRIPTS} />;
}
`;
}

const BOOT_JSX = `"use client";
import { useEffect, useRef } from "react";

/**
 * 把原本頁面的 script 照順序掛回去。
 *
 * 不能用 next/script：afterInteractive 不保證順序，而這一頁是
 * chart.js →版面 JS → live.js 這種有先後的關係，順序錯了圖表畫不出來，
 * 而且不會報錯，只會看起來少一塊。
 *
 * 也不能靠 dangerouslySetInnerHTML 帶 <script>——React 不會執行它們。
 */
export default function Boot({ markup, scripts }) {
  const host = useRef(null);
  const booted = useRef(false);

  useEffect(() => {
    /* React 嚴格模式下 effect 會跑兩次，掛第二遍會把事件監聽器重複註冊，
       表現是「按一下送出兩筆」。只跑一次。 */
    if (booted.current) return;
    booted.current = true;

    let cancelled = false;
    (async () => {
      for (const src of scripts) {
        if (cancelled) return;
        await new Promise((done) => {
          const el = document.createElement("script");
          el.src = src;
          /* 載不到就繼續下一支。少一支通常是少一塊功能，
             整頁停在這裡的話客戶會看到一片空白。 */
          el.onload = done;
          el.onerror = done;
          document.body.appendChild(el);
        });
      }
    })();
    return () => { cancelled = true; };
  }, [scripts]);

  return <div ref={host} dangerouslySetInnerHTML={{ __html: markup }} />;
}
`;

function nextConfig(target) {
  /* live.js 打的是 ./_jv/schema，那條路徑不能改——改了等於改動所有實例的
     runtime。而 App Router 會把底線開頭的資料夾當成私有資料夾排除在路由外，
     所以 app/_jv/schema/route.js 不會變成路由。用 rewrite 導到真正的路由。
     /_health 同理：交付版的 CI 靠它判斷系統起來了沒。 */
  const rules = ['{ source: "/_jv/schema", destination: "/api/schema" }'];
  if (target === "docker") rules.push('{ source: "/_health", destination: "/api/health" }');
  return `const nextConfig = {
${target === "docker" ? `  /* 交付版跑在客戶自己的 Docker 裡，用 standalone 之外的最單純做法：
     直接 next start。映像檔大一點，但少一層「哪些檔案有被追蹤到」的問題——
     那種問題只會在客戶的機器上第一次啟動時才炸開。 */
` : ""}  async rewrites() {
    return [
${rules.map((r) => "      " + r).join(",\n")}
    ];
  },
};
export default nextConfig;
`;
}

const ROUTE_SCHEMA = `import { describe } from "../../../lib/instance-db.mjs";

/* 每次都要讀資料庫。少了這一行，Next 會把回應當成靜態內容快取起來，
   客戶改了資料卻看到舊的，而且不會有任何錯誤訊息。 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await describe(process.env.MYSQL_DB));
  } catch (e) {
    return Response.json({ error: e.message || "伺服器錯誤" }, { status: 500 });
  }
}
`;

const ROUTE_TABLE = `import { list, create } from "../../../../lib/instance-db.mjs";

export const dynamic = "force-dynamic";

const DB = () => process.env.MYSQL_DB;
const ok = (t) => /^[a-z][a-z0-9_]*$/.test(String(t || ""));

export async function GET(req, { params }) {
  const { table } = await params;
  if (!ok(table)) return Response.json({ error: "表名不正確" }, { status: 400 });
  const u = new URL(req.url);
  try {
    return Response.json(await list(DB(), table, {
      limit: u.searchParams.get("limit") || 50,
      offset: u.searchParams.get("offset") || 0,
      q: u.searchParams.get("q") || "",
    }));
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req, { params }) {
  const { table } = await params;
  if (!ok(table)) return Response.json({ error: "表名不正確" }, { status: 400 });
  try {
    /* 公開網址沒有登入，記不到是誰做的。寫 public 而不是留空——
       日後看稽核表時，「這筆是從公開版來的」本身就是有用的資訊。 */
    return Response.json({ row: await create(DB(), table, await req.json(), "public") }, { status: 201 });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
`;

const ROUTE_ROW = `import { update, remove } from "../../../../../lib/instance-db.mjs";

export const dynamic = "force-dynamic";

const DB = () => process.env.MYSQL_DB;
const ok = (t) => /^[a-z][a-z0-9_]*$/.test(String(t || ""));

export async function PATCH(req, { params }) {
  const { table, id } = await params;
  if (!ok(table)) return Response.json({ error: "表名不正確" }, { status: 400 });
  try {
    const { rev, ...values } = await req.json();
    if (rev == null) return Response.json({ error: "缺少 rev（用來偵測同時編輯）" }, { status: 400 });
    const r = await update(DB(), table, Number(id), values, rev, "public");
    if (!r.ok && r.reason === "conflict") {
      return Response.json({ error: "這筆資料已被其他人修改，請重新載入", current: r.current }, { status: 409 });
    }
    if (!r.ok) return Response.json({ error: r.reason }, { status: 400 });
    return Response.json({ row: r.row });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  const { table, id } = await params;
  if (!ok(table)) return Response.json({ error: "表名不正確" }, { status: 400 });
  try {
    const done = await remove(DB(), table, Number(id), "public");
    return Response.json({ ok: done }, { status: done ? 200 : 404 });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
`;

const ROUTE_HEALTH = `/* 交付版的 CI 與 docker compose 都靠這一支判斷系統起來了沒。 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: true });
}
`;

const INIT_DB = `/**
 * 第一次啟動時依 schema.json 建表並灌範例資料。
 *
 * 站台版是在 HTTP 伺服器啟動時做這件事，但 Next.js 沒有一個對應的「啟動鉤子」，
 * 而放進 route handler 的話，第一個打進來的請求會等在那裡建表——
 * 客戶第一次打開會看到轉圈圈很久，然後不知道發生了什麼事。
 * 所以獨立成一步，在 next start 之前跑完。
 *
 * createFromSchema 是 CREATE TABLE IF NOT EXISTS，表已經存在就不動它，
 * 所以重啟不會洗掉你輸入的東西。
 */
import fs from "node:fs";
import { createFromSchema } from "../lib/instance-db.mjs";
import { close } from "../lib/mysql.mjs";

const schema = JSON.parse(fs.readFileSync(new URL("../schema.json", import.meta.url), "utf8"));
await createFromSchema(process.env.MYSQL_DB || "app", schema, { seed: process.env.SEED !== "0" });
await close();
console.log("資料表已就緒");
`;

export const PKG = {
  name: "jv-instance",
  private: true,
  scripts: { dev: "next dev", build: "next build", start: "next start" },
  dependencies: {
    next: "15.5.4",
    react: "19.1.0",
    "react-dom": "19.1.0",
    mysql2: "^3.11.0",
  },
};

/**
 * 把 srcPublic（實例的 public/）轉成 out（一個 Next.js 專案）。
 * libFiles 是要放進 lib/ 的檔案 [{ name, from }]。
 * 回 { scripts, tables } 之類的摘要，讓呼叫端印出來對得起來。
 */
export function build(srcPublic, out, { libFiles = [], sharedDir = null, target = "vercel", schema = null } = {}) {
  const html = fs.readFileSync(path.join(srcPublic, "index.html"), "utf8");
  const d = dissect(html);

  const w = (rel, body) => {
    const f = path.join(out, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, body);
  };

  /* public/：原本 _jv 底下那些 runtime 原封不動搬過去。
     Next 只把 app/ 底下的底線資料夾當私有，public/_jv 照樣送得出去。 */
  fs.cpSync(srcPublic, path.join(out, "public"), { recursive: true });
  fs.rmSync(path.join(out, "public", "index.html"), { force: true });
  if (d.inline) w("public/_jv/page.js", d.inline);

  /* 原本的頁面用絕對路徑載 /shared/jv-agent-bridge.js，那是平台在服務的，
     部署出去之後那個路徑不存在——現在的公開版一直在 404 這一支。
     把它一起帶上，公開版才跟站上看到的一樣。 */
  if (sharedDir && fs.existsSync(sharedDir)) {
    fs.cpSync(sharedDir, path.join(out, "public", "shared"), { recursive: true });
  }

  w("app/globals.css", d.styles);
  w("app/layout.jsx", layoutJsx(d));
  w("app/page.jsx", pageJsx(d));
  w("app/boot.jsx", BOOT_JSX);
  w("app/api/schema/route.js", ROUTE_SCHEMA);
  w("app/api/t/[table]/route.js", ROUTE_TABLE);
  w("app/api/t/[table]/[id]/route.js", ROUTE_ROW);
  w("next.config.mjs", nextConfig(target));
  if (target === "docker") {
    w("app/api/health/route.js", ROUTE_HEALTH);
    w("scripts/init-db.mjs", INIT_DB);
    if (schema) w("schema.json", JSON.stringify(schema, null, 2) + "\n");
  }
  w("package.json", JSON.stringify(PKG, null, 2) + "\n");
  w(".gitignore", "node_modules\n.next\n.vercel\n");

  for (const { name, from } of libFiles) {
    fs.mkdirSync(path.join(out, "lib"), { recursive: true });
    fs.copyFileSync(from, path.join(out, "lib", name));
  }

  return { scripts: d.scripts.length, inlineBytes: d.inline.length, styleBytes: d.styles.length };
}
