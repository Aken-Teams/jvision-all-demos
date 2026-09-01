/**
 * 客戶用講的改自己的系統。
 *
 * 只做「把一句話翻成一個動作」，動作本身仍然走既有的 instance-db——
 * 讓 LLM 直接碰資料庫的話，它想錯一次就是客戶的資料出事。
 *
 * 能做的動作刻意很少（加欄位、改欄位名稱），其餘一律收成待辦。少而確定
 * 比多而不可靠好：客戶對「說了會發生什麼」要有把握，才敢真的用它改東西。
 */
import { spawn } from "node:child_process";

const TIMEOUT_MS = 90000;

/** 只接受這幾種動作。LLM 回別的就當成 none，交給人處理。 */
const ACTIONS = new Set(["add_column", "rename_column", "rename_system", "edit_page", "undo", "none"]);
const TYPES = new Set(["text", "int", "number", "percent", "date", "enum"]);
const KEY_RE = /^[a-z][a-z0-9_]{0,62}$/;

function prompt(schema, message, history, hasImage) {
  const tables = schema.tables.map((t) =>
    `- ${t.name}：${t.columns.map((c) => `${c.label}(${c.key}/${c.type})`).join("、")}`).join("\n");
  const past = (history || []).slice(-6)
    .map((h) => `${h.role === "user" ? "使用者" : "你"}：${String(h.text).slice(0, 200)}`).join("\n");

  return `你是這套系統的修改助理。使用者會用中文說他想改什麼，你要判斷該做哪一個動作。

## 這套系統現有的資料表
${tables}

${past ? `## 剛才的對話\n${past}\n` : ""}
## 使用者這次說
${message}
${hasImage ? `
## 他還附了一張截圖
你看不到那張圖，但真正動手改的那一步看得到。所以只要他的要求跟畫面的外觀、
位置、版面有關（「照這樣改」「改成這個樣子」「這裡要調整」都算），
一律選 edit_page，不要因為文字描述含糊就回 none——含糊的部分圖上有答案。
` : ""}
## 你能做的動作
1. add_column —— 加一個欄位。要給 table、key、label、type。
2. rename_column —— 改欄位的顯示名稱。要給 table、key（既有欄位的 key）、label（新名字）。
3. rename_system —— 改整套系統的名稱（畫面最上方那個標題）。要給 label（新名稱）。
4. edit_page —— 改這套系統的行為或畫面：加按鈕、改流程步驟、改計算方式、改版面、
   加圖表、改文案。凡是「要動到程式或畫面」的都走這個。要在 reply 說會花幾分鐘。
5. undo —— 他說「還原」「改回去」「取消剛才的修改」。
6. none —— 你真的做不到的（串接外部系統、寄信、接金流…），或是他只是在問問題。

## 規則
- key 只能用小寫英文與底線，開頭必須是英文字母。加欄位時自己取一個貼切的。
- type 從 text / int / number / percent / date / enum 挑最貼切的。
- 改名時 key 必須是上面列出來的既有 key，不可以自己編。
- 不確定他指哪一個欄位時，用 none 並在 reply 裡問清楚，不要猜。
- reply 用繁體中文，可以用 Markdown（**粗體**、- 清單、| 表格 |、\`程式碼\`）。
  排版規則：**一句話講得完就一句話**，不要為了排版硬加標題。
  但只要是在「列出東西」——有哪些資料表、每張表有哪些欄位、做了哪幾件事——
  就一定要拆成清單或表格，不要擠成一整段。使用者看到一大段連續文字時，
  要自己用眼睛把逗號當成分隔符去斷句，那是我們該替他做的事。

  例如他問「這套系統有哪些欄位」，要這樣回：

  這套系統有三張資料表：

  | 資料表 | 欄位 |
  |---|---|
  | 損失費用單 | 支出單號、損失費用類別、請款廠商、發票號碼、含稅金額、理賠歸屬 |
  | 核賠明細 | 核賠費用科目、申請金額、核定金額、扣減金額 |
  | 入帳對帳 | 入帳日期、匯款保險公司、銀行摘要、匯入金額、建議理賠案件、配對結果 |

  而不是把三張表擠成一段文字。
- 動作是 none 而且你做不到時，說明會轉給我們處理。

只輸出 JSON，不要任何其他文字：
{"action":"add_column|rename_column|rename_system|edit_page|undo|none","table":"","key":"","label":"","type":"","reply":""}`;
}

function runClaude(text) {
  return new Promise((resolve) => {
    const args = ["-p", "--output-format", "json", "--permission-mode", "dontAsk",
      "--disallowedTools", "WebSearch,WebFetch,Bash,Edit,Write,Task,Read,Glob,Grep"];
    const child = spawn("claude", args, { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    const timer = setTimeout(() => { child.kill("SIGKILL"); done(null); }, TIMEOUT_MS);

    child.stdout.on("data", (d) => { out += d; });
    child.on("error", () => { clearTimeout(timer); done(null); });
    child.on("close", () => {
      clearTimeout(timer);
      try {
        const wrap = JSON.parse(out);
        const body = String(wrap.result || "");
        /* 模型有時會把 JSON 包在說明或圍籬裡，只取第一個大括號到最後一個。 */
        const a = body.indexOf("{"), b = body.lastIndexOf("}");
        done(a >= 0 && b > a ? JSON.parse(body.slice(a, b + 1)) : null);
      } catch { done(null); }
    });
    child.stdin.write(text);
    child.stdin.end();
  });
}

/**
 * 想一次。回 { action, table, key, label, type, reply }，
 * 想不出來或格式不對時一律降級成 none——寧可交給人，不要做錯的事。
 */
export async function decide(schema, message, history, hasImage) {
  const raw = await runClaude(prompt(schema, message, history, hasImage));
  const fallback = { action: "none", reply: "我先把這個需求記下來，交給我們的人處理。" };
  if (!raw || !ACTIONS.has(raw.action)) return fallback;

  /* 上限 300 是給「一到兩句」的年代訂的。現在回覆會用 Markdown 排版，
     一張三欄的表就超過了——實測列九張資料表時被切在半路，最後一列只剩一個
     直槓，畫面上會渲染成一個殘缺的表格。 */
  const reply = String(raw.reply || "").slice(0, 1600) || fallback.reply;
  if (raw.action === "none") return { action: "none", reply };

  if (raw.action === "edit_page") return { action: "edit_page", reply };
  if (raw.action === "undo") return { action: "undo", reply };

  if (raw.action === "rename_system") {
    const label = String(raw.label || "").trim().slice(0, 60);
    if (!label) return { action: "none", reply: "新的名稱要叫什麼？" };
    return { action: "rename_system", label, reply };
  }

  const table = schema.tables.find((t) => t.name === raw.table) || schema.tables[0];
  if (!table) return fallback;

  if (raw.action === "rename_column") {
    /* key 必須真的存在。模型偶爾會自己編一個看起來合理的 key，
       照做的話會改到不存在的欄位而回一句「已改好」，是最糟的失敗。 */
    const hit = table.columns.find((c) => c.key === raw.key);
    const label = String(raw.label || "").trim().slice(0, 60);
    if (!hit || !label) return { action: "none", reply: "我不確定你指的是哪一個欄位，可以說得再具體一點嗎？" };
    return { action: "rename_column", table: table.name, key: hit.key, label, reply };
  }

  const key = String(raw.key || "").trim().toLowerCase();
  const label = String(raw.label || "").trim().slice(0, 60);
  if (!KEY_RE.test(key) || !label) return fallback;
  if (table.columns.some((c) => c.key === key)) {
    return { action: "none", reply: `「${label}」看起來已經有了，要改它的名字還是加別的欄位？` };
  }
  return { action: "add_column", table: table.name, key, label,
    type: TYPES.has(raw.type) ? raw.type : "text", reply };
}
