/**
 * 客戶系統右下角的修改助理。
 *
 * 它刻意不是一個「聊天機器人」。客戶最常提的三種修改——加欄位、改欄位名稱、
 * 其他——前兩種後端本來就做得到，讓它們當場生效比讓人描述需求、等我們回覆
 * 好得多；做不到的第三種才收成待辦。假裝什麼都能聊、實際上只會回「已收到」，
 * 比誠實地說「這個我現在就能改，那個要排」更傷信任。
 *
 * 表格結構一律從 ./_jv/schema 當場問後端，不從畫面上猜——畫面可能被原本的
 * JS 重繪過，而後端那份才是真的。
 */
(function () {
  "use strict";
  if (window.__jvAssist) return;
  window.__jvAssist = true;

  var schema = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function css() {
    if (document.getElementById("jv-assist-css")) return;
    var st = document.createElement("style");
    st.id = "jv-assist-css";
    st.textContent =
      "#jvAsstBtn{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:56px;height:56px;border-radius:9999px;border:0;cursor:pointer;background:linear-gradient(135deg,#1e40af,#7c3aed);color:#fff;box-shadow:0 10px 28px rgba(15,23,42,.34);display:grid;place-content:center;transition:transform .15s}" +
      "#jvAsstBtn:hover{transform:translateY(-2px)}" +
      "#jvAsstBtn svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}" +
      "#jvAsstWrap{position:fixed;right:20px;bottom:88px;z-index:2147483000;width:340px;max-width:calc(100vw - 32px);max-height:min(560px,calc(100vh - 120px));background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 22px 60px rgba(15,23,42,.24);display:flex;flex-direction:column;overflow:hidden;font-family:Inter,'Noto Sans TC','Microsoft JhengHei',sans-serif}" +
      "#jvAsstWrap *{box-sizing:border-box}" +
      "#jvAsstWrap .hd{display:flex;align-items:center;gap:.5rem;padding:.75rem .9rem;border-bottom:1px solid #f1f5f9}" +
      "#jvAsstWrap .hd b{font-size:.88rem;color:#0f172a;font-weight:800}" +
      "#jvAsstWrap .hd small{display:block;font-size:.7rem;color:#64748b;font-weight:500;margin-top:.1rem}" +
      "#jvAsstWrap .x{margin-left:auto;background:none;border:0;font-size:20px;line-height:1;color:#94a3b8;cursor:pointer;padding:0 .2rem}" +
      "#jvAsstWrap .bd{padding:.85rem .9rem;overflow-y:auto;flex:1}" +
      "#jvAsstWrap .opt{display:block;width:100%;text-align:left;padding:.6rem .7rem;margin-bottom:.4rem;border:1px solid #e2e8f0;border-radius:.6rem;background:#fff;cursor:pointer;font:inherit;font-size:.82rem;font-weight:700;color:#0f172a}" +
      "#jvAsstWrap .opt:hover{border-color:#1e40af;background:#f8fafc}" +
      "#jvAsstWrap .opt i{display:block;font-style:normal;font-weight:500;font-size:.72rem;color:#64748b;margin-top:.15rem}" +
      "#jvAsstWrap label{display:block;font-size:.72rem;font-weight:800;color:#475569;margin:.6rem 0 .25rem}" +
      "#jvAsstWrap select,#jvAsstWrap input,#jvAsstWrap textarea{width:100%;border:1px solid #e2e8f0;border-radius:.5rem;padding:.45rem .55rem;font:inherit;font-size:.82rem;color:#0f172a;background:#fff}" +
      "#jvAsstWrap textarea{min-height:88px;resize:vertical}" +
      "#jvAsstWrap .go{width:100%;margin-top:.8rem;padding:.55rem;border:0;border-radius:.5rem;background:#1e40af;color:#fff;font:inherit;font-size:.84rem;font-weight:800;cursor:pointer}" +
      "#jvAsstWrap .go:hover{background:#3b82f6}" +
      "#jvAsstWrap .back{background:none;border:0;color:#64748b;font:inherit;font-size:.76rem;cursor:pointer;padding:0;margin-bottom:.5rem}" +
      "#jvAsstWrap .note{font-size:.74rem;line-height:1.5;margin-top:.6rem;padding:.5rem .6rem;border-radius:.5rem}" +
      "#jvAsstWrap .ok{background:#ecfdf5;color:#15803d}" +
      "#jvAsstWrap .err{background:#fef2f2;color:#b91c1c}" +
      "#jvAsstWrap .muted{font-size:.76rem;color:#64748b;line-height:1.55}" +
      "#jvAsstWrap.chat{width:400px;height:min(560px,calc(100vh - 120px));max-height:none}" +
      "#jvChat{flex:1;overflow-y:auto;padding:.8rem .9rem;display:flex;flex-direction:column;gap:.55rem}" +
      "#jvChat .m{max-width:86%;padding:.5rem .7rem;border-radius:.75rem;font-size:.82rem;line-height:1.55;white-space:pre-wrap;word-break:break-word}" +
      "#jvChat .me{align-self:flex-end;background:#1e40af;color:#fff;border-bottom-right-radius:.2rem}" +
      "#jvChat .bot{align-self:flex-start;background:#f1f5f9;color:#0f172a;border-bottom-left-radius:.2rem}" +
      "#jvChat .done{align-self:flex-start;background:#ecfdf5;color:#15803d;font-weight:700}" +
      "#jvChat .thinking{align-self:flex-start;color:#94a3b8;font-size:.78rem}" +
      "#jvAsk{display:flex;gap:.4rem;padding:.6rem .7rem;border-top:1px solid #f1f5f9}" +
      "#jvAsk textarea{flex:1;min-height:38px;max-height:110px;resize:none;border:1px solid #e2e8f0;border-radius:.6rem;padding:.45rem .6rem;font:inherit;font-size:.82rem}" +
      "#jvAsk button{flex:none;width:38px;border:0;border-radius:.6rem;background:#1e40af;color:#fff;cursor:pointer;font-size:16px}" +
      "#jvAsk button:disabled{opacity:.5;cursor:default}" +
      "#jvShot{padding:0 .7rem .5rem;position:relative}" +
      "#jvShot img{width:100%;border:1px solid #e2e8f0;border-radius:.5rem;display:block}" +
      "#jvShot button{position:absolute;top:.2rem;right:.9rem;width:22px;height:22px;border:0;border-radius:9999px;background:rgba(15,23,42,.75);color:#fff;cursor:pointer;font-size:14px;line-height:1;padding:0}" +
      "#jvChat .shot img{max-width:100%;border-radius:.5rem;margin-top:.35rem;display:block}" +
      "#jvAsstWrap .chips{display:flex;flex-wrap:wrap;gap:.3rem;padding:0 .9rem .6rem}" +
      "#jvAsstWrap .chips button{font-size:.72rem;border:1px solid #e2e8f0;background:#fff;color:#64748b;border-radius:9999px;padding:.2rem .55rem;cursor:pointer;font-family:inherit}" +
      "#jvAsstWrap .chips button:hover{border-color:#1e40af;color:#1e40af}" +
      "#jvAsstWrap .drop{margin-top:.35rem;border:1.5px dashed #cbd5e1;border-radius:.6rem;padding:.7rem;text-align:center;cursor:pointer;background:#f8fafc}" +
      "#jvAsstWrap .drop:hover,#jvAsstWrap .drop.on{border-color:#1e40af;background:#eff6ff}" +
      "#jvAsstWrap .drop span{font-size:.75rem;color:#64748b;font-weight:600}" +
      "#jvAsstWrap .shot{position:relative;margin-top:.5rem}" +
      "#jvAsstWrap .shot img{width:100%;border:1px solid #e2e8f0;border-radius:.5rem;display:block}" +
      "#jvAsstWrap .shot button{position:absolute;top:.3rem;right:.3rem;width:22px;height:22px;border:0;border-radius:9999px;background:rgba(15,23,42,.75);color:#fff;cursor:pointer;font-size:14px;line-height:1;padding:0}";
    document.head.appendChild(st);
  }

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      /* text 要當內容，不能當屬性。原本沒有這一條，對話訊息全部變成空泡泡
         ——div 有了、字沒有，而且不會報錯，只會看起來像壞掉。
         用 textContent 而不是 innerHTML：這裡放的是使用者與模型的文字。 */
      if (k === "text") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    if (html != null) e.innerHTML = html;
    return e;
  }

  function mount() {
    css();
    var btn = el("button", { id: "jvAsstBtn", type: "button", title: "需要修改什麼？", "aria-label": "修改助理" },
      '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 7V4"/><circle cx="9" cy="13" r="1.1" fill="#fff" stroke="none"/><circle cx="15" cy="13" r="1.1" fill="#fff" stroke="none"/><path d="M9.5 16.4h5"/></svg>');
    document.body.appendChild(btn);
    btn.addEventListener("click", function () {
      var w = document.getElementById("jvAsstWrap");
      if (w) { w.remove(); return; }
      open();
    });
  }

  /* 對話視窗。原本是三顆固定選項的選單，但客戶想改的東西沒辦法列舉——
     用講的才是他腦子裡本來的形狀。做不到的仍然收成待辦，所以不會有
     「講了半天卻沒有下文」的情況。 */
  function open() {
    var wrap = el("div", { id: "jvAsstWrap", class: "chat" });
    wrap.innerHTML =
      '<div class="hd"><div><b>修改助理</b><small>用講的就好，例如「加一個爐號欄位」</small></div>' +
      '<button class="x" type="button" aria-label="關閉">×</button></div>' +
      '<div id="jvChat"></div>' +
      '<div class="chips">' +
        '<button type="button">加一個備註欄位</button>' +
        '<button type="button">把「負責人」改叫「業務窗口」</button>' +
        '<button type="button">狀態要多一個「已結案」</button>' +
      "</div>" +
      '<div id="jvShot"></div>' +
      '<div id="jvAsk"><textarea rows="1" placeholder="想改什麼？直接說，也可以貼截圖。"></textarea>' +
      '<button type="button" title="送出">↑</button></div>';
    document.body.appendChild(wrap);
    wrap.querySelector(".x").addEventListener("click", function () { wrap.remove(); });
    wrap.addEventListener("click", function (e) { e.stopPropagation(); });

    say("bot", "這套系統的欄位、名稱都可以改。說一句話就行，我做得到的當場就改；做不到的我幫你記下來轉給我們的人。");

    /* 截圖縮到最寬 1400px 再送。原圖動輒好幾 MB，而我們要的是「他指哪裡」，
       這個解析度綽綽有餘。 */
    wrap.addEventListener("paste", function (e) {
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i += 1) {
        if (items[i].type && items[i].type.indexOf("image/") === 0) {
          e.preventDefault();
          shrinkImage(items[i].getAsFile(), setShot);
          return;
        }
      }
    });

    var ta = wrap.querySelector("#jvAsk textarea");
    var send = wrap.querySelector("#jvAsk button");
    send.addEventListener("click", function () { submit(ta.value); });
    ta.addEventListener("keydown", function (e) {
      /* Enter 送出、Shift+Enter 換行。聊天框裡這是大家的肌肉記憶。 */
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(ta.value); }
    });
    wrap.querySelectorAll(".chips button").forEach(function (b) {
      b.addEventListener("click", function () { submit(b.textContent); });
    });
    ta.focus();
  }

  var history = [];
  var pendingShot = null;

  function shrinkImage(blob, done) {
    if (!blob || !/^image\//.test(blob.type)) return;
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function () {
      var w = img.width, h = img.height, max = 1400;
      if (w > max) { h = Math.round(h * max / w); w = max; }
      var cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { done(cv.toDataURL("image/jpeg", 0.82)); } catch (e) { /* 讀不進來就當作沒貼 */ }
    };
    img.onerror = function () { URL.revokeObjectURL(url); };
    img.src = url;
  }

  function setShot(dataUrl) {
    pendingShot = dataUrl;
    var box = document.getElementById("jvShot");
    if (!box) return;
    box.innerHTML = dataUrl
      ? '<img alt="截圖預覽" src="' + dataUrl + '" /><button type="button" aria-label="移除截圖">×</button>'
      : "";
    var b = box.querySelector("button");
    if (b) b.addEventListener("click", function () { setShot(null); });
  }

  function say(role, text, cls) {
    var box = document.getElementById("jvChat");
    if (!box) return null;
    var m = el("div", { class: "m " + (cls || (role === "user" ? "me" : "bot")), text: text });
    box.appendChild(m);
    box.scrollTop = box.scrollHeight;
    return m;
  }

  function submit(text) {
    var msg = String(text || "").trim();
    if (!msg && pendingShot) msg = "照這張截圖改";   // 只貼圖不打字也要能送
    if (!msg) return;
    var wrap = document.getElementById("jvAsstWrap");
    if (!wrap) return;
    var ta = wrap.querySelector("#jvAsk textarea");
    var send = wrap.querySelector("#jvAsk button");
    ta.value = "";
    send.disabled = true;
    var shot = pendingShot;
    setShot(null);
    say("user", msg);
    /* 自己貼的圖也要顯示在對話裡——不然送出後圖就消失了，
       他會不確定到底有沒有帶上去。 */
    if (shot) {
      var box = document.getElementById("jvChat");
      var wrapImg = el("div", { class: "m me shot" });
      wrapImg.appendChild(el("img", { src: shot, alt: "我貼的截圖" }));
      box.appendChild(wrapImg);
      box.scrollTop = box.scrollHeight;
    }
    history.push({ role: "user", text: msg });
    var wait = say("bot", "想一下…", "thinking");

    fetch("./_jv/chat", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: msg, history: history.slice(-6), shot: shot }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (wait) wait.remove();
        send.disabled = false;
        var reply = (x.d && (x.d.reply || x.d.error)) || "我沒聽懂，換個說法再說一次？";
        say("bot", reply, x.d && x.d.changed ? "done" : "bot");
        history.push({ role: "assistant", text: reply });
        /* 真的改了東西就重新整理，讓他馬上看到結果——只回一句「已改好」
           而畫面沒變，他不會相信。 */
        if (x.d && x.d.changed) {
          say("bot", "重新整理畫面…", "thinking");
          setTimeout(function () { location.reload(); }, 1200);
          return;
        }
        /* 改程式碼是背景工作。這裡不能只回一句「我來改」就沒下文——
           使用者不會知道要等多久，也不知道到底有沒有在做。 */
        if (x.d && x.d.job) pollJob();
      })
      .catch(function () {
        if (wait) wait.remove();
        send.disabled = false;
        say("bot", "連不上伺服器，稍後再試一次。");
      });
  }

  /* 等背景的程式修改做完。每三秒問一次，並把已經等了多久顯示出來——
     沉默的等待會讓人以為當掉了。 */
  function pollJob() {
    var wrap = document.getElementById("jvAsstWrap");
    if (!wrap) return;
    var send = wrap.querySelector("#jvAsk button");
    var ta = wrap.querySelector("#jvAsk textarea");
    send.disabled = true;
    ta.disabled = true;
    var line = say("bot", "改寫中…（通常一到三分鐘）", "thinking");

    var timer = setInterval(function () {
      fetch("./_jv/job", { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!document.getElementById("jvAsstWrap")) { clearInterval(timer); return; }
          if (j.state === "running") {
            if (line) line.textContent = "改寫中…已經 " + (j.seconds || 0) + " 秒（通常一到三分鐘）";
            return;
          }
          clearInterval(timer);
          if (line) line.remove();
          send.disabled = false;
          ta.disabled = false;
          if (j.state === "done") {
            say("bot", j.reply || "改好了。", "done");
            say("bot", "重新整理畫面…", "thinking");
            setTimeout(function () { location.reload(); }, 1400);
          } else if (j.state === "failed") {
            /* 失敗要說出原因並提醒他原本的畫面沒被動到——他才敢再試下一個講法。 */
            say("bot", (j.reply || "這次沒改成。") + "（原本的畫面沒有被動到）");
          }
        })
        .catch(function () { /* 一次問不到不要緊，下一輪再問 */ });
    }, 3000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
