(function jvisionDynamicCharts() {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const PANEL_SELECTOR = ".jv-analytics-panel";
  const CHART_MARKER = "jvDynamicChartsAttached";

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function numeric(value) {
    const matched = String(value || "").match(/-?\d+(?:\.\d+)?/);
    return matched ? Number(matched[0]) : 0;
  }

  function hash(value) {
    return String(value).split("").reduce((total, character) => ((total << 5) - total + character.charCodeAt(0)) | 0, 0);
  }

  function makeElement(name, attributes, text) {
    const element = document.createElement(name);
    Object.entries(attributes || {}).forEach(([key, value]) => element.setAttribute(key, value));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function makeSvg(name, attributes, text) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes || {}).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function currentRange(panel) {
    const selected = panel.querySelector('.jv-range-button[aria-pressed="true"]');
    return Number(selected?.dataset.range) === 30 ? 30 : 7;
  }

  function readRecords(panel) {
    return [...panel.querySelectorAll(".jv-data-table tbody tr")].map((row, index) => {
      const cells = [...row.querySelectorAll("td")].map((cell) => cell.textContent.trim());
      return {
        index,
        score: numeric(cells[4]),
        risk: /高風險|需關注|risk/i.test(cells[3] || "") ? 1 : 0,
      };
    });
  }

  function trendRows(panel, range) {
    const records = readRecords(panel);
    const average = records.length
      ? Math.round(records.reduce((total, record) => total + record.score, 0) / records.length)
      : 60;
    const attention = records.reduce((total, record) => total + record.risk, 0);
    const points = range === 30 ? 10 : 7;
    const seed = Math.abs(hash(panel.id + "-" + average + "-" + attention));
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric" });

    return Array.from({ length: points }, (_, index) => {
      const remaining = points - 1 - index;
      const wave = ((seed + index * 17) % 9) - 4;
      const trend = Math.round(average - remaining * (range === 30 ? 0.8 : 1.35) + wave);
      const date = new Date(now);
      date.setDate(now.getDate() - remaining * (range === 30 ? 3 : 1));
      return {
        label: formatter.format(date),
        score: clamp(trend, 35, 99),
        attention: clamp(attention + ((seed + index * 5) % 3) - 1, 0, Math.max(1, records.length)),
      };
    });
  }

  function drawTrend(host, rows) {
    const width = 560;
    const height = 218;
    const left = 40;
    const right = 22;
    const top = 18;
    const bottom = 40;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const minimum = 30;
    const maximum = 100;
    const point = (row, index) => ({
      x: left + (chartWidth / Math.max(rows.length - 1, 1)) * index,
      y: top + ((maximum - row.score) / (maximum - minimum)) * chartHeight,
    });
    const coordinates = rows.map(point);
    const svg = makeSvg("svg", {
      class: "jv-trend-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-label": "AI 評分趨勢：" + rows.map((row) => row.label + " " + row.score + "分").join("，"),
    });

    [40, 60, 80, 100].forEach((value) => {
      const y = top + ((maximum - value) / (maximum - minimum)) * chartHeight;
      svg.append(makeSvg("line", { x1: left, y1: y, x2: width - right, y2: y, class: "jv-trend-grid-line" }));
      svg.append(makeSvg("text", { x: 0, y: y + 4, class: "jv-trend-axis-label" }, String(value)));
    });

    const targetY = top + ((maximum - 75) / (maximum - minimum)) * chartHeight;
    svg.append(makeSvg("line", { x1: left, y1: targetY, x2: width - right, y2: targetY, class: "jv-trend-target-line" }));
    svg.append(makeSvg("text", { x: width - right, y: targetY - 6, class: "jv-trend-target-label", "text-anchor": "end" }, "目標 75"));

    const points = coordinates.map((coordinate) => coordinate.x + "," + coordinate.y).join(" ");
    const area = coordinates.length
      ? left + "," + (height - bottom) + " " + points + " " + (width - right) + "," + (height - bottom)
      : "";
    svg.append(makeSvg("polygon", { points: area, class: "jv-trend-area" }));
    svg.append(makeSvg("polyline", { points, class: "jv-trend-line" }));

    coordinates.forEach((coordinate, index) => {
      const row = rows[index];
      svg.append(makeSvg("circle", {
        cx: coordinate.x,
        cy: coordinate.y,
        r: index === coordinates.length - 1 ? 5 : 3.5,
        class: index === coordinates.length - 1 ? "jv-trend-point jv-trend-point-current" : "jv-trend-point",
      }));
      svg.append(makeSvg("text", { x: coordinate.x, y: height - 14, class: "jv-trend-date-label", "text-anchor": "middle" }, row.label));
    });

    host.replaceChildren(svg);
  }

  function renderTrendTable(body, rows) {
    body.replaceChildren();
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.append(
        makeElement("td", { "data-label": "日期" }, row.label),
        makeElement("td", { "data-label": "AI 評分" }, row.score + " 分"),
        makeElement("td", { "data-label": "需關注" }, row.attention + " 筆"),
        makeElement("td", { "data-label": "狀態" }, index === rows.length - 1 ? "目前資料" : "歷程推演"),
      );
      body.append(tr);
    });
  }

  function mount(panel) {
    if (panel.dataset[CHART_MARKER] === "true") return;
    const grid = panel.querySelector(".jv-analytics-grid");
    const tableCard = grid?.querySelector(".jv-table-card");
    if (!grid || !tableCard) return;
    panel.dataset[CHART_MARKER] = "true";

    const card = makeElement("article", { class: "jv-chart-card jv-dynamic-trend-card" });
    const heading = makeElement("div", { class: "jv-card-heading jv-trend-heading" });
    const headingCopy = makeElement("div");
    headingCopy.append(
      makeElement("h3", { id: panel.id + "-trend-title" }, "AI 評分趨勢"),
      makeElement("p", {}, "依目前資料即時重算，並保留可讀取的歷程表。"),
    );
    const refresh = makeElement("button", { class: "jv-trend-refresh", type: "button", "aria-label": "重新整理 AI 評分趨勢" }, "更新圖表");
    heading.append(headingCopy, refresh);

    const status = makeElement("p", { class: "jv-trend-status", "aria-live": "polite" });
    const chart = makeElement("div", { class: "jv-trend-chart", role: "group", "aria-labelledby": panel.id + "-trend-title" });
    const controls = makeElement("div", { class: "jv-trend-footer" });
    const toggle = makeElement("button", { class: "jv-trend-toggle", type: "button", "aria-expanded": "false" }, "顯示趨勢資料");
    const description = makeElement("span", {}, "實線：AI 評分 · 虛線：目標 75 分");
    controls.append(toggle, description);
    const data = makeElement("div", { class: "jv-trend-data", hidden: "" });
    const table = makeElement("table", { class: "jv-trend-table" });
    table.append(
      makeElement("caption", {}, "AI 評分趨勢資料表"),
      makeElement("thead", {}, ""),
      makeElement("tbody", {}, ""),
    );
    const headRow = document.createElement("tr");
    ["日期", "AI 評分", "需關注", "狀態"].forEach((label) => headRow.append(makeElement("th", { scope: "col" }, label)));
    table.querySelector("thead").append(headRow);
    data.append(table);
    card.append(heading, status, chart, controls, data);
    grid.insertBefore(card, tableCard);

    let updateTimer;
    const tableBody = panel.querySelector(".jv-data-table tbody");
    const render = (announced) => {
      const range = currentRange(panel);
      const rows = trendRows(panel, range);
      drawTrend(chart, rows);
      renderTrendTable(table.querySelector("tbody"), rows);
      const latest = rows.at(-1);
      status.textContent = "近 " + range + " 日 · 最新 AI 評分 " + latest.score + " 分 · " + latest.attention + " 筆需關注" + (announced ? " · 已更新" : "");
    };
    const schedule = () => {
      clearTimeout(updateTimer);
      updateTimer = setTimeout(() => render(false), 120);
    };

    refresh.addEventListener("click", () => render(true));
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      toggle.textContent = expanded ? "顯示趨勢資料" : "收起趨勢資料";
      data.hidden = expanded;
    });
    panel.querySelectorAll(".jv-range-button").forEach((button) => button.addEventListener("click", schedule));
    window.addEventListener("storage", schedule);
    document.addEventListener("jvision:demo-data-change", schedule);
    if (tableBody) new MutationObserver(schedule).observe(tableBody, { childList: true, subtree: true, characterData: true });
    render(false);
  }

  function discover() {
    document.querySelectorAll(PANEL_SELECTOR).forEach(mount);
  }

  const observer = new MutationObserver(discover);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", discover, { once: true });
  else discover();
})();
