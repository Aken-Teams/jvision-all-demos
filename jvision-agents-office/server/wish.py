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

RADAR_DIMS = ["效益潛力", "可行性", "資料就緒度", "自動化空間", "導入急迫度"]

SYS = (
    "你是企業 AI 導入顧問，面對的是【不懂技術的一般使用者】。使用者描述需求或痛點，你要用【白話、貼近他實際狀況】的方式，"
    "讓他知道：他遇到的問題本質是什麼、可以怎麼改善、適合哪些 AI 技術，並針對他的狀況做一份評估。\n"
    "全程繁體中文（台灣用語），不要自稱 ChatGPT 或 OpenAI。用白話、精簡。\n"
    f"從下列 AI 技術中挑出 3–5 個最貼切的做成技術標籤：{TECH_MENU}。\n"
    "另外針對『這位使用者的需求』在 5 個固定面向各打一個 0–100 分（要依他的描述給出【有高低差異】的分數，不要全部給高分；有把握就給高、資訊不足或難度高就給中低）：\n"
    "  效益潛力＝導入後幫助有多大；可行性＝以現有技術落地的容易度；資料就緒度＝他手上資料是否足夠可用；"
    "自動化空間＝可被自動化取代的人工比例；導入急迫度＝這件事有多需要盡快處理。\n"
    "只輸出 JSON（不要 markdown 圍欄、不要多餘文字、不要註解）：\n"
    '{"problem":"用白話點出使用者遇到的問題本質（1 句，站在他的角度）",'
    '"summary":"建議的解決方向（1 句白話，不用艱深術語）",'
    '"recommendations":[{'
    '"tag":"2-6字技術短標籤（例：OCR、NER、RAG、LLM）",'
    '"tech":"完整技術名（hover 補充用，例：自然語言處理 NLP）",'
    '"benefit":"白話說這技術能幫你做到什麼（1 句，站在使用者角度）"}],'
    '"scores":{"效益潛力":0-100,"可行性":0-100,"資料就緒度":0-100,"自動化空間":0-100,"導入急迫度":0-100}}'
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
    """呼叫 gemma4（非串流、帶瀏覽器 UA 避開 Cloudflare）→ 回結構化建議。
    thinking 模型有時把 token 花在思考、content 回空；只解析 content，失敗就重試幾次。"""
    def _gateway():
        body = json.dumps({
            "model": OLLAMA_MODEL,
            "messages": [{"role": "system", "content": SYS}, {"role": "user", "content": f"我的需求：{need}"}],
            "max_tokens": 7000, "stream": False,
        }).encode("utf-8")
        req = urllib.request.Request(f"{OLLAMA_URL}/v1/chat/completions", method="POST", data=body,
                                     headers={"Authorization": f"Bearer {OLLAMA_KEY}", "Content-Type": "application/json",
                                              "User-Agent": UA, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=120, context=ssl.create_default_context()) as r:
            data = json.loads(r.read())
        return (data["choices"][0]["message"].get("content") or "").strip()

    parsed, last_err, text = None, None, ""
    for _ in range(3):  # content 空/JSON 壞 → 重試（thinking 模型非決定性）
        try:
            content = _gateway()
        except Exception as e:
            last_err = e; continue
        if content:
            text = content
        p = _extract_json(content)
        if p and p.get("problem") and p.get("scores"):  # 要有關鍵欄位才算成功，半成品就重試
            parsed = p; break
    if parsed is None:
        if last_err is not None:
            raise last_err
        parsed = {}
    items = parsed.get("recommendations") or parsed.get("technologies") or []
    clean = []
    for t in items[:6]:
        if not isinstance(t, dict):
            continue
        tech = str(t.get("tech") or t.get("name") or "").strip()[:40]
        tag = str(t.get("tag") or t.get("capability") or "").strip()[:8]
        benefit = str(t.get("benefit") or t.get("why") or "").strip()[:90]
        if not (tag or tech or benefit):
            continue
        if not tag:
            tag = (tech.split(" ")[0] or "AI")[:8]
        clean.append({"tag": tag, "tech": tech or tag, "benefit": benefit})
    if not clean:
        clean = [{"tag": "LLM", "tech": "大型語言模型 LLM", "benefit": "先用 AI 理解並歸納你的需求，找出可自動化的環節。"}]
    # 5 個固定面向評分（依需求給有高低差的分數；缺/不合理則給中性 65）
    sc = parsed.get("scores") or {}
    radar = []
    for name in RADAR_DIMS:
        try:
            v = int(float(sc.get(name)))
        except Exception:
            v = 65
        radar.append({"name": name, "score": max(20, min(100, v))})
    return {"problem": str(parsed.get("problem", "")).strip()[:150],
            "summary": (str(parsed.get("summary", "")).strip()[:200] or text[:150]),
            "recommendations": clean, "radar": radar}


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
