const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 12;
const MAX_CONTEXT_LENGTH = 4200;
const MAX_EVIDENCE_ITEMS = 12;
const requestLog = new Map();

function text(value, maxLength) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function getIp(req) {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || String(req.headers?.["x-real-ip"] || "unknown");
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    requestLog.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(ip, recent);
  if (requestLog.size > 2048) {
    for (const [key, timestamps] of requestLog) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_WINDOW_MS)) requestLog.delete(key);
    }
  }
  return false;
}

function readBody(req) {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return req.body && typeof req.body === "object" ? req.body : null;
}

function normaliseEvidence(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_EVIDENCE_ITEMS).map((item, index) => ({
    label: text(item?.label || `畫面資料 ${index + 1}`, 100),
    value: text(item?.value, 220),
    source: text(item?.source || "目前畫面", 120),
  })).filter((item) => item.value);
}

function normalisePayload(body) {
  const project = body?.project && typeof body.project === "object" ? body.project : {};
  const payload = {
    title: text(project.title, 140),
    description: text(project.description, 360),
    repoName: text(project.repoName, 120),
    module: text(body?.module, 100),
    action: text(body?.action, 100),
    task: text(body?.task || body?.action, 120),
    role: text(body?.role, 100),
    context: text(body?.context, MAX_CONTEXT_LENGTH),
    evidence: normaliseEvidence(body?.evidence),
  };
  return payload.title ? payload : null;
}

function safeAdvice(content) {
  const fallback = {
    headline: "AI 情境分析",
    summary: text(content, 800) || "目前無法產生可驗證的分析結果。",
    actions: [],
    evidence: [],
    risk: "medium",
    confidence: 0,
    requiresConfirmation: true,
  };
  try {
    const raw = String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(raw);
    const actions = Array.isArray(parsed.actions)
      ? parsed.actions.map((item) => text(item, 180)).filter(Boolean).slice(0, 3)
      : [];
    const evidence = Array.isArray(parsed.evidence)
      ? parsed.evidence.slice(0, 5).map((item) => ({
          label: text(item?.label, 100),
          value: text(item?.value, 220),
          source: text(item?.source || "目前畫面", 120),
        })).filter((item) => item.label && item.value)
      : [];
    const risk = ["low", "medium", "high"].includes(parsed.risk) ? parsed.risk : "medium";
    const confidenceValue = Number(parsed.confidence);
    const confidence = Number.isFinite(confidenceValue)
      ? Math.max(0, Math.min(1, confidenceValue))
      : 0;
    return {
      headline: text(parsed.headline, 100) || fallback.headline,
      summary: text(parsed.summary, 800) || fallback.summary,
      actions,
      evidence,
      risk,
      confidence,
      requiresConfirmation: parsed.requiresConfirmation !== false,
    };
  } catch {
    return fallback;
  }
}

function buildMessages(payload) {
  const evidence = payload.evidence.length
    ? payload.evidence.map((item, index) => `${index + 1}. ${item.label}: ${item.value}（來源：${item.source}）`).join("\n")
    : "沒有可引用的結構化畫面證據；請降低信心程度，且不得自行創造編號或數值。";
  return [
    {
      role: "system",
      content: [
        "你是 JV Demo 的情境決策助理。回答必須以使用者目前畫面提供的資料為依據。",
        "禁止虛構訂單、客戶、設備、工單、數值或已完成的操作。",
        "每項關鍵判斷都要在 evidence 引用輸入中的原始 label、value 與 source。",
        "建議只能作為待確認操作，不得宣稱已核准、已提交、已刪除或已變更正式資料。",
        "若證據不足，請明確說明限制、降低 confidence，並提出需要補充的資料。",
        "只輸出 JSON，不要 Markdown。格式：",
        '{"headline":"不超過 40 字","summary":"不超過 300 字","actions":["建議一","建議二"],"evidence":[{"label":"欄位","value":"畫面原值","source":"來源區塊"}],"risk":"low|medium|high","confidence":0.0,"requiresConfirmation":true}',
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `專案：${payload.title}`,
        `專案識別：${payload.repoName || "未提供"}`,
        `專案說明：${payload.description || "未提供"}`,
        `目前模組：${payload.module || "總覽"}`,
        `使用者角色：${payload.role || "一般使用者"}`,
        `分析任務：${payload.task || "分析目前狀況"}`,
        `觸發操作：${payload.action || "AI 情境分析"}`,
        "可引用的畫面證據：",
        evidence,
        "補充畫面內容：",
        payload.context || "未提供",
      ].join("\n"),
    },
  ];
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.DEEPSEEK_API_KEY) return res.status(503).json({ error: "AI 服務尚未設定" });
  if (isRateLimited(getIp(req))) return res.status(429).json({ error: "AI 請求過於頻繁，請稍後再試" });

  const payload = normalisePayload(readBody(req));
  if (!payload) return res.status(400).json({ error: "Demo 資料不完整" });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
        messages: buildMessages(payload),
        temperature: 0.2,
        max_tokens: 700,
        stream: false,
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: status === 429 ? "AI 服務繁忙，請稍後再試" : "AI 服務暫時無法使用" });
    }
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: "AI 沒有回傳分析結果" });
    return res.status(200).json({ advice: safeAdvice(content), model: data.model || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash" });
  } catch (error) {
    return res.status(502).json({ error: error?.name === "AbortError" ? "AI 回應逾時，請稍後再試" : "AI 服務暫時無法使用" });
  } finally {
    clearTimeout(timeout);
  }
};

module.exports._test = { normalisePayload, safeAdvice, buildMessages };
