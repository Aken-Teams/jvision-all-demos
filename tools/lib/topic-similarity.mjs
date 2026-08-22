/**
 * 題目去重：中文 trigram 集合 + containment（重疊係數），五道閘。
 *
 * trigrams() / containment() 沿用 tools/audit-project-description-similarity.mjs
 * 的演算法（該檔為 top-level 腳本、未 export，故複製而非 import）。
 *
 * 與原版的三處關鍵差異：
 *  1. 標題與全文分開比。標題短、trigram 少，用合併文字比會被描述稀釋
 *     （實測：「生產工單管理系統」對既有「生產工單管理」合併後低於門檻而漏放行）。
 *  2. 分群軸改用 systemType 而非 category —— 28 種 category 命名混亂
 *     （「物流運輸」vs「倉儲物流」），systemType 才代表同一套模組骨架。
 *  3. 多一層 boilerplate 剝除。既有 description 是模板產的，滿是「Jvision」
 *     「集中處理」「操作紀錄」，不剝會讓所有東西互相高分而使門檻失效。
 */

export const THRESHOLDS = {
  title: 0.85,        // G2：標題比對，不分型
  sameType: 0.72,     // G3：同 systemType 全文（沿用原版門檻）
  crossType: 0.80,    // G4：跨型全文，拉高避免誤殺
  // G5 批內門檻依實測噪音底線校準（3000 組無關配對）：
  //   全文 —— 99 百分位 0.151、最高 0.292 → 取 0.35 留餘裕
  //   標題 —— 最高 0.500、≥0.55 為零     → 取 0.55
  // 同批 LLM 產出天然互相回聲，門檻必須比對外部更低才擋得住。
  batchTitle: 0.55,
  batchFull: 0.35,
};

/** 模板噪音；只剝固定短語，不剝「管理」「系統」這類語意字。 */
const BOILERPLATE = [
  // 站上既有 description 的模板
  "Jvision", "JVision", "互動展示", "集中處理", "操作紀錄", "擬真示範",
  "不必再以試算表或訊息往返確認", "當現場需要", "時可使用",
  "處理例外並保存結果", "只需查看逾期", "衝突或待確認項目",
  // Master List 的模板（實測 500 筆逐字相同，不剝會讓彼此相似度全面虛高）
  "現行作法對", "多靠人工彙整、個人經驗或事後處理，難以一致追蹤，造成決策延遲與重工",
  "資料／事件接入", "證據與信心呈現", "例外分流與人工覆核", "完整稽核軌跡", "成效追蹤",
];

const strip = (value) => {
  let text = String(value || "");
  for (const phrase of BOILERPLATE) text = text.split(phrase).join("");
  return text.replace(/[A-Za-z0-9（）()／/、，。・·「」\s_-]/g, "");
};

export const trigrams = (value) => {
  const text = strip(value);
  const result = new Set();
  for (let index = 0; index < text.length - 2; index += 1) {
    result.add(text.slice(index, index + 3));
  }
  return result;
};

export const containment = (left, right) => {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const value of left) if (right.has(value)) shared += 1;
  return shared / Math.max(1, Math.min(left.size, right.size));
};

/**
 * 標題相似度。
 * 剝除英數後產不出 trigram（中文少於 3 字）時只認「完全相同」，
 * 刻意不做包含比對 —— 否則「DevOps/CI-CD 平台」會剝成「平台」，
 * 使所有以「平台」結尾的題目都被判為重複（實測過的假陽性）。
 */
function titleScore(a, b) {
  const sa = strip(a), sb = strip(b);
  if (!sa || !sb) return 0;
  if (sa === sb) return 1;
  const ga = trigrams(a), gb = trigrams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  return containment(ga, gb);
}

/** 把既有專案整理成可重複比對的索引。 */
export function buildExistingIndex(projects, classify) {
  return projects.map((project) => ({
    repoName: project.repoName,
    title: project.title,
    systemType: classify(project),
    titleGrams: trigrams(project.title),
    fullGrams: trigrams(`${project.title} ${project.description || ""}`),
  }));
}

function entryOf(candidate) {
  return {
    repoName: candidate.repoName || `jvision-${candidate.slug || ""}`,
    title: candidate.title,
    systemType: candidate.systemType,
    titleGrams: trigrams(candidate.title),
    fullGrams: trigrams(`${candidate.title} ${candidate.description || ""}`),
  };
}

/**
 * 對單一候選跑 G1–G4（比既有池）。命中即回報，未命中回 null。
 * @returns {{gate:string,repoName:string,title:string,score:number}|null}
 */
export function findNearest(candidate, index, options = {}) {
  const T = { ...THRESHOLDS, ...options };
  const me = entryOf(candidate);
  const dirs = options.existingDirs;

  // G1：repoName 完全相同
  if (dirs && dirs.has(me.repoName)) {
    return { gate: "G1", repoName: me.repoName, title: candidate.title, score: 1 };
  }

  let best = null;
  const consider = (entry, score, gate) => {
    if (!best || score > best.score) best = { gate, repoName: entry.repoName, title: entry.title, score: Number(score.toFixed(3)) };
  };

  for (const entry of index) {
    if (entry.repoName === me.repoName) return { gate: "G1", repoName: entry.repoName, title: entry.title, score: 1 };

    // G2：標題，不分型
    const ts = titleScore(candidate.title, entry.title);
    if (ts >= T.title) { consider(entry, ts, "G2"); continue; }

    // G3 / G4：全文，同型較嚴、跨型較寬
    const fs = containment(me.fullGrams, entry.fullGrams);
    const sameType = entry.systemType === me.systemType;
    if (sameType && fs >= T.sameType) consider(entry, fs, "G3");
    else if (!sameType && fs >= T.crossType) consider(entry, fs, "G4");
  }
  return best;
}

/** G5：與同批次已通過者比對，門檻比對外更嚴。 */
function findBatchEcho(candidate, batchIndex) {
  const me = entryOf(candidate);
  for (const entry of batchIndex) {
    const ts = titleScore(candidate.title, entry.title);
    if (ts >= THRESHOLDS.batchTitle) {
      return { gate: "G5", repoName: entry.repoName, title: entry.title, score: Number(ts.toFixed(3)) };
    }
    const fs = containment(me.fullGrams, entry.fullGrams);
    if (fs >= THRESHOLDS.batchFull) {
      return { gate: "G5", repoName: entry.repoName, title: entry.title, score: Number(fs.toFixed(3)) };
    }
  }
  return null;
}

const REASONS = {
  G1: "repoName 已存在",
  G2: "標題與既有專案重複",
  G3: "同類型全文重複",
  G4: "跨類型全文重複",
  G5: "與本批次其他候選重複",
};

/**
 * 逐一審查候選：先比既有池（G1–G4），再比同批次已通過者（G5）。
 * 被判重複的不丟棄，標記 gate / duplicateOf / score 一併回傳。
 */
export function screenCandidates(candidates, index, options = {}) {
  const accepted = [];
  const rejected = [];
  const batchIndex = [];

  for (const candidate of candidates) {
    const hit = findNearest(candidate, index, options) || findBatchEcho(candidate, batchIndex);
    if (hit) {
      rejected.push({
        ...candidate,
        reason: REASONS[hit.gate] || "重複",
        gate: hit.gate,
        duplicateOf: hit.repoName,
        matchedTitle: hit.title,
        score: hit.score,
      });
      continue;
    }
    accepted.push(candidate);
    batchIndex.push(entryOf(candidate));
  }
  return { accepted, rejected };
}
