"""許願分析：使用者描述需求 → 地端 gemma4 建議適合的 AI 技術 → 存進 MySQL(ai_wish_analysis)。
掛在現有後端(app.py :4610)上，不另開 port。設定讀『專案根目錄』的 .env。
"""
from __future__ import annotations
import json, os, re, ssl, urllib.request, urllib.error

# server → jvision-agents-office → 專案根目錄
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def load_env():
    path = os.path.join(_ROOT, ".env")
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


load_env()


def _mysql_cfg():
    return dict(host=os.environ.get("MYSQL_HOST"), port=int(os.environ.get("MYSQL_PORT", "3306")),
                user=os.environ.get("MYSQL_USER"), password=os.environ.get("MYSQL_PASSWORD"),
                database=os.environ.get("MYSQL_DB"))


OLLAMA_URL = (os.environ.get("OLLAMA_API_URL") or "").rstrip("/")
OLLAMA_KEY = os.environ.get("OLLAMA_API_KEY") or ""
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL") or "gemma4:latest"

TECH_MENU = ("RAG 檢索增強生成、OCR 光學字元辨識、LLM 大型語言模型、NLP 自然語言處理、"
             "電腦視覺 CV、語音辨識 ASR、語音合成 TTS、時序預測、異常偵測、推薦系統、"
             "知識圖譜、語意搜尋、文件分類、命名實體辨識 NER、RPA 流程自動化、多模態 AI、"
             "情感分析、機器翻譯、聚類分群、強化學習")

SYS = (
    "你是企業 AI 導入顧問，面對的是【不懂技術的一般使用者】。使用者描述需求或痛點，你要用【白話、貼近他實際狀況】的方式，"
    "讓他知道：他遇到的問題本質是什麼、可以怎麼改善、以及 AI 能幫他做到什麼。\n"
    "全程繁體中文（台灣用語），不要自稱 ChatGPT 或 OpenAI。\n"
    "【最重要】不要只丟技術名詞（例如只說『用自然語言處理』外行人看不懂）。"
    "請先用白話講『這能幫你做到什麼、解決你什麼狀況』，把艱深的技術名只當『補充標註』。\n"
    f"可挑選的 AI 技術（3–5 個最關鍵的）：{TECH_MENU}。\n"
    "只輸出 JSON（不要 markdown 圍欄、不要多餘文字、不要註解）：\n"
    '{"problem":"用白話點出使用者遇到的問題本質（1 句，站在他的角度，例：你的困擾是大量文件靠人工整理、又花時間又容易漏）",'
    '"summary":"建議的解決方向（1 句白話，不用艱深術語）",'
    '"recommendations":[{'
    '"capability":"白話能力標籤，4-8字（雷達圖軸用，例：自動讀文件、看懂語意、情緒判斷、找關鍵資訊、預測故障、智慧問答）",'
    '"tag":"2-6字的技術短標籤（做成標籤用，例：OCR、NER、RAG、LLM、電腦視覺）",'
    '"benefit":"白話說這能幫你做到什麼、解決你什麼狀況（1 句，站在使用者角度，不要只寫技術名）",'
    '"tech":"背後用到的 AI 技術名稱（hover 補充用，例：自然語言處理 NLP）",'
    '"fit":"高/中/低"}],'
    '"next_step":"白話的第一步建議（1 句）"}'
)


def _extract_json(text):
    text = (text or "").replace("```json", "").replace("```", "")
    a, b = text.find("{"), text.rfind("}")
    if a < 0 or b <= a:
        return None
    frag = text[a:b + 1]
    for cand in (frag, re.sub(r",\s*([}\]])", r"\1", frag)):
        try:
            return json.loads(cand)
        except Exception:
            pass
    return None


def analyze(need: str) -> dict:
    """呼叫 gemma4（非串流、帶瀏覽器 UA 避開 Cloudflare）→ 回結構化建議。"""
    body = json.dumps({
        "model": OLLAMA_MODEL,
        "messages": [{"role": "system", "content": SYS}, {"role": "user", "content": f"我的需求：{need}"}],
        "max_tokens": 2000, "stream": False,
    }).encode("utf-8")
    req = urllib.request.Request(f"{OLLAMA_URL}/v1/chat/completions", method="POST", data=body,
                                 headers={"Authorization": f"Bearer {OLLAMA_KEY}", "Content-Type": "application/json",
                                          "User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120, context=ssl.create_default_context()) as r:
        data = json.loads(r.read())
    msg = data["choices"][0]["message"]
    text = (msg.get("content") or msg.get("reasoning") or "").strip()
    parsed = _extract_json(text) or {}
    items = parsed.get("recommendations") or parsed.get("technologies") or []
    clean = []
    for t in items[:5]:
        if not isinstance(t, dict):
            continue
        cap = str(t.get("capability") or t.get("short") or "").strip()[:10]
        tech = str(t.get("tech") or t.get("name") or "").strip()[:40]
        tag = str(t.get("tag") or "").strip()[:8]
        benefit = str(t.get("benefit") or t.get("why") or "").strip()[:90]
        fit = (str(t.get("fit", "中")).strip()[:4] or "中")
        if not (cap or tech or benefit):
            continue
        if not cap:
            cap = (tech.split(" ")[0] or "AI 能力")[:8]
        if not tag:
            tag = (tech.split(" ")[0] if tech else cap)[:8]
        clean.append({"capability": cap, "tag": tag, "benefit": benefit, "tech": tech or cap, "fit": fit})
    if not clean:
        clean = [{"capability": "AI 輔助", "tag": "LLM", "benefit": "先用 AI 理解並歸納你的需求，找出可自動化的環節。", "tech": "大型語言模型 LLM", "fit": "中"}]
    return {"problem": str(parsed.get("problem", "")).strip()[:150],
            "summary": (str(parsed.get("summary", "")).strip()[:200] or text[:150]),
            "recommendations": clean,
            "next_step": str(parsed.get("next_step", "")).strip()[:150]}


def ensure_table():
    import pymysql
    conn = pymysql.connect(connect_timeout=15, charset="utf8mb4", autocommit=True, **_mysql_cfg())
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS ai_wish_analysis (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    need_text TEXT NOT NULL,
                    summary TEXT,
                    technologies_json JSON,
                    next_step VARCHAR(255),
                    model VARCHAR(64)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """)
    finally:
        conn.close()


def save(need: str, result: dict):
    import pymysql
    conn = pymysql.connect(connect_timeout=15, charset="utf8mb4", autocommit=True, **_mysql_cfg())
    try:
        with conn.cursor() as cur:
            summary_db = "｜".join(x for x in [result.get("problem", ""), result.get("summary", "")] if x)
            cur.execute(
                "INSERT INTO ai_wish_analysis (need_text, summary, technologies_json, next_step, model) VALUES (%s,%s,%s,%s,%s)",
                (need, summary_db, json.dumps(result.get("recommendations", []), ensure_ascii=False),
                 result.get("next_step", ""), OLLAMA_MODEL))
    finally:
        conn.close()
