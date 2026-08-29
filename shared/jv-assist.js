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
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
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

  function open() {
    var wrap = el("div", { id: "jvAsstWrap" });
    wrap.innerHTML =
      '<div class="hd"><div><b>修改助理</b><small>想改哪裡？有些我現在就能改</small></div>' +
      '<button class="x" type="button" aria-label="關閉">×</button></div><div class="bd"></div>';
    document.body.appendChild(wrap);
    wrap.querySelector(".x").addEventListener("click", function () { wrap.remove(); });
    menu();
    /* schema 先抓起來放著。等使用者選了「加欄位」才抓，會多一次等待，
       而他那時候已經在等了。 */
    if (!schema) {
      fetch("./_jv/schema", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { schema = d; })
        .catch(function () {});
    }
  }

  var body = function () { var w = document.getElementById("jvAsstWrap"); return w && w.querySelector(".bd"); };

  function menu() {
    var b = body(); if (!b) return;
    b.innerHTML =
      '<button class="opt" data-go="add">加一個欄位<i>例如加「備註」、「聯絡電話」</i></button>' +
      '<button class="opt" data-go="rename">改欄位的名稱<i>換成你們公司習慣的說法</i></button>' +
      '<button class="opt" data-go="ask">其他修改<i>流程、畫面、規則——寫下來我們處理</i></button>';
    b.querySelectorAll("[data-go]").forEach(function (x) {
      x.addEventListener("click", function () {
        var g = x.dataset.go;
        if (g === "add") return addField();
        if (g === "rename") return renameField();
        return ask();
      });
    });
  }

  function backBtn(b) {
    var back = el("button", { class: "back", type: "button" }, "← 回上一步");
    back.addEventListener("click", menu);
    b.appendChild(back);
  }

  function tableOptions() {
    if (!schema || !schema.tables || !schema.tables.length) return null;
    return schema.tables.map(function (t) {
      return '<option value="' + esc(t.name) + '">' + esc(t.name) + "（" + t.columns.length + " 欄）</option>";
    }).join("");
  }

  /* 改完欄位會把 schema 設成 null 讓它重抓。原本這裡只畫一句「讀取中」
     卻沒有人真的去讀，於是改完一次之後，畫面就永遠停在那句話上。
     現在由這支負責：沒有就抓，抓到再畫，抓不到才顯示錯誤。 */
  function withSchema(render) {
    var b = body(); if (!b) return;
    if (schema && schema.tables && schema.tables.length) return render();
    b.innerHTML = "";
    backBtn(b);
    b.insertAdjacentHTML("beforeend", '<p class="muted">正在讀取這套系統的資料表…</p>');
    fetch("./_jv/schema", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        schema = d;
        if (d && d.tables && d.tables.length) return render();
        var bb = body(); if (!bb) return;
        bb.innerHTML = "";
        backBtn(bb);
        bb.insertAdjacentHTML("beforeend", '<p class="muted">這套系統目前沒有可以修改的資料表。你可以用「其他修改」告訴我們想要什麼。</p>');
      })
      .catch(function () {
        var bb = body(); if (!bb) return;
        bb.innerHTML = "";
        backBtn(bb);
        bb.insertAdjacentHTML("beforeend", '<p class="muted">讀不到資料表，請重新整理頁面再試。</p>');
      });
  }

  function addField() { withSchema(drawAdd); }
  function drawAdd() {
    var b = body(); if (!b) return;
    var opts = tableOptions();
    b.innerHTML = "";
    backBtn(b);
    b.insertAdjacentHTML("beforeend",
      '<label>加在哪張表</label><select id="jvaT">' + opts + "</select>" +
      '<label>欄位名稱</label><input id="jvaL" maxlength="40" placeholder="例如：備註" />' +
      '<label>資料型別</label><select id="jvaTy">' +
        '<option value="text">文字</option><option value="int">整數</option>' +
        '<option value="number">數字（可有小數）</option><option value="date">日期</option>' +
      "</select>" +
      '<button class="go" type="button">加上去</button><div id="jvaMsg"></div>');
    b.querySelector(".go").addEventListener("click", function () {
      var label = b.querySelector("#jvaL").value.trim();
      var msg = b.querySelector("#jvaMsg");
      if (!label) { msg.innerHTML = '<div class="note err">請先寫欄位名稱</div>'; return; }
      /* key 由名稱推導。中文推不出英數字時退回時間戳，總之要是個合法識別字
         ——後端會擋掉不合法的，但在這裡先給一個能用的比讓他看到錯誤好。 */
      var key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      if (!/^[a-z]/.test(key)) key = "c_" + Date.now().toString(36).slice(-6);
      fetch("./_jv/columns", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ table: b.querySelector("#jvaT").value, key: key, label: label,
          type: b.querySelector("#jvaTy").value }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok) { msg.innerHTML = '<div class="note err">' + esc(x.d.error || "加不上去") + "</div>"; return; }
          msg.innerHTML = '<div class="note ok">已加上「' + esc(label) + '」。重新整理就會看到這一欄。</div>';
          schema = null; // 結構變了，下次要重抓
        })
        .catch(function () { msg.innerHTML = '<div class="note err">連不上伺服器</div>'; });
    });
  }

  function renameField() { withSchema(drawRename); }
  function drawRename() {
    var b = body(); if (!b) return;
    var opts = tableOptions();
    b.innerHTML = "";
    backBtn(b);
    b.insertAdjacentHTML("beforeend",
      '<label>哪張表</label><select id="jvrT">' + opts + "</select>" +
      '<label>哪個欄位</label><select id="jvrC"></select>' +
      '<label>改成什麼名字</label><input id="jvrL" maxlength="40" />' +
      '<button class="go" type="button">改名稱</button><div id="jvrMsg"></div>');
    var tSel = b.querySelector("#jvrT"), cSel = b.querySelector("#jvrC"), lIn = b.querySelector("#jvrL");
    function fillCols() {
      var t = schema.tables.filter(function (x) { return x.name === tSel.value; })[0];
      cSel.innerHTML = (t ? t.columns : []).map(function (c) {
        return '<option value="' + esc(c.key) + '">' + esc(c.label) + "</option>";
      }).join("");
      lIn.value = cSel.options.length ? cSel.options[cSel.selectedIndex].textContent : "";
    }
    tSel.addEventListener("change", fillCols);
    cSel.addEventListener("change", function () { lIn.value = cSel.options[cSel.selectedIndex].textContent; });
    fillCols();
    b.querySelector(".go").addEventListener("click", function () {
      var msg = b.querySelector("#jvrMsg"), label = lIn.value.trim();
      if (!label) { msg.innerHTML = '<div class="note err">請先寫新名稱</div>'; return; }
      fetch("./_jv/columns", { method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ table: tSel.value, key: cSel.value, label: label }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok) { msg.innerHTML = '<div class="note err">' + esc(x.d.error || "改不了") + "</div>"; return; }
          msg.innerHTML = '<div class="note ok">已改成「' + esc(label) + '」。重新整理就會看到。</div>';
          schema = null;
        })
        .catch(function () { msg.innerHTML = '<div class="note err">連不上伺服器</div>'; });
    });
  }

  /* 截圖縮到最寬 1400px 再送。原圖動輒好幾 MB，而我們要的是「指出位置」，
     那個解析度綽綽有餘；不縮的話手機端上傳會等很久，也更容易撞上大小上限。
     一律轉成 JPEG：貼上的螢幕截圖多半是 PNG，同樣畫質下 JPEG 小一個量級。 */
  function shrink(blob, done) {
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function () {
      var w = img.width, h = img.height, max = 1400;
      if (w > max) { h = Math.round(h * max / w); w = max; }
      var cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { done(cv.toDataURL("image/jpeg", 0.82)); } catch (e) { done(null); }
    };
    img.onerror = function () { URL.revokeObjectURL(url); done(null); };
    img.src = url;
  }

  function ask() {
    var b = body(); if (!b) return;
    var shotData = null;
    b.innerHTML = "";
    backBtn(b);
    b.insertAdjacentHTML("beforeend",
      '<p class="muted">流程要多一關、畫面要換位置、要多一個報表——寫得越具體，做出來越接近你要的。</p>' +
      '<label>你想改成什麼樣子</label><textarea id="jvqT" maxlength="2000" placeholder="例如：出貨前要多一關主管簽核，沒簽核不能出貨。"></textarea>' +
      '<label>截圖（可省略）</label>' +
      '<div class="drop" id="jvqDrop"><span>按 Ctrl+V 貼上截圖，或點這裡選檔案</span></div>' +
      '<input type="file" id="jvqFile" accept="image/*" hidden />' +
      '<div id="jvqShot"></div>' +
      '<button class="go" type="button">送出</button><div id="jvqMsg"></div>');

    var drop = b.querySelector("#jvqDrop"), file = b.querySelector("#jvqFile");
    var shotBox = b.querySelector("#jvqShot"), msg = b.querySelector("#jvqMsg");

    function setShot(dataUrl) {
      shotData = dataUrl;
      if (!dataUrl) { shotBox.innerHTML = ""; drop.hidden = false; return; }
      drop.hidden = true;
      shotBox.innerHTML = '<div class="shot"><img alt="截圖預覽" src="' + dataUrl + '" />' +
        '<button type="button" title="移除截圖" aria-label="移除截圖">×</button></div>';
      shotBox.querySelector("button").addEventListener("click", function () { setShot(null); });
    }

    function take(blob) {
      if (!blob || !/^image\//.test(blob.type)) return;
      shrink(blob, function (d) {
        if (d) setShot(d);
        else msg.innerHTML = '<div class="note err">這張圖讀不進來，換一張試試</div>';
      });
    }

    drop.addEventListener("click", function () { file.click(); });
    file.addEventListener("change", function () { if (file.files[0]) take(file.files[0]); });

    /* 貼上要能在整個面板任何地方生效——使用者剛截完圖，游標多半還不在輸入框裡。
       只掛在 textarea 上，最常見的那個動作就會沒有反應。 */
    var wrap = document.getElementById("jvAsstWrap");
    wrap.addEventListener("paste", function (e) {
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i += 1) {
        if (items[i].type && items[i].type.indexOf("image/") === 0) {
          e.preventDefault();
          take(items[i].getAsFile());
          return;
        }
      }
    });
    ["dragover", "dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.toggle("on", ev === "dragover");
        if (ev === "drop" && e.dataTransfer && e.dataTransfer.files[0]) take(e.dataTransfer.files[0]);
      });
    });

    b.querySelector(".go").addEventListener("click", function () {
      var text = b.querySelector("#jvqT").value.trim();
      if (!text) { msg.innerHTML = '<div class="note err">請先寫下你想改的地方</div>'; return; }
      msg.innerHTML = '<div class="note muted">送出中…</div>';
      fetch("./_jv/request", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text, shot: shotData,
          /* 順手把他現在停在哪一頁帶上去。同一句「這裡要改」在不同畫面
             意思完全不同，而使用者不會想到要交代這件事。 */
          screen: (document.title || "") + " ｜ " + (location.hash || "") }) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok) { msg.innerHTML = '<div class="note err">' + esc(x.d.error || "送不出去") + "</div>"; return; }
          msg.innerHTML = '<div class="note ok">已收到' + (x.d.shot ? "（含截圖）" : "") + "，會有人跟你聯絡。</div>";
          b.querySelector("#jvqT").value = "";
          setShot(null);
        })
        .catch(function () { msg.innerHTML = '<div class="note err">連不上伺服器</div>'; });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
