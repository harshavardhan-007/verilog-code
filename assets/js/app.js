/* ==========================================================
   UI wiring: theme, nav, library, search, generator,
   truth table / K-map / minimization views, code viewer
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg, kind = "ok") {
    toastEl.textContent = msg;
    toastEl.className = `toast show ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.className = "toast"), 2200);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast("Copied to clipboard ✓"); }
    catch { toast("Copy failed. Select the code manually.", "err"); }
  }

  /* ---------- Theme ---------- */
  function setupTheme() {
    const root = document.documentElement;
    $("#themeToggle").addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = next;
      try { localStorage.setItem("vl-theme", next); } catch (e) { /* private mode */ }
      document.querySelector('meta[name="theme-color"]').content = next === "light" ? "#f4f7fb" : "#070b11";
    });
  }

  /* ---------- Verilog syntax highlighting ---------- */
  const KEYWORDS = new Set(("module endmodule input output inout wire reg integer assign always initial begin end case endcase default " +
    "if else for while posedge negedge and or not buf nand nor xor xnor parameter localparam").split(" "));

  function highlight(src) {
    const re = /(\/\/[^\n]*)|(`\w+[^\n]*)|(\$\w+)|("[^"\n]*")|(\b\d*'[bBhHdDoO][0-9a-fA-FxXzZ_]+|\b\d+\b)|(\b[A-Za-z_]\w*\b)|([\s\S])/g;
    return src.replace(re, (m, com, dir, sys, str, num, word) => {
      const t = esc(m);
      if (com) return `<span class="c">${t}</span>`;
      if (dir) return `<span class="d">${t}</span>`;
      if (sys) return `<span class="f">${t}</span>`;
      if (str) return `<span class="s">${t}</span>`;
      if (num) return `<span class="n">${t}</span>`;
      if (word && KEYWORDS.has(word)) return `<span class="k">${t}</span>`;
      return t;
    });
  }

  /* ---------- Library ---------- */
  const ARROW = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>`;
  const snippets = {};

  function renderLibrary() {
    $("#library").innerHTML = LIBRARY.map((s) => `
      <section class="panel lib" id="${s.id}" data-section>
        <div class="panel-head">
          <span class="tag">${s.num}</span>
          <div><h2>${esc(s.title)}</h2><p>${esc(s.desc)}</p></div>
        </div>
        <div class="groups">
          ${s.groups.map((g, gi) => `
            <div class="group" data-group>
              <h3>${esc(g.name)}</h3>
              ${g.note ? `<p class="note">${esc(g.note)}</p>` : ""}
              <div class="links">
                ${g.links.map((l, li) => {
                  const key = `${s.id}-${gi}-${li}`;
                  if (l.code) snippets[key] = { title: `${g.name} · ${l.label}`, code: l.code };
                  return `
                  <div class="link-row">
                    <a class="link" href="${l.url}" target="_blank" rel="noopener noreferrer"
                       data-search="${esc((s.title + " " + g.name + " " + (g.note || "") + " " + l.label + " " + (l.tag || "")).toLowerCase())}">
                      <span>${esc(l.label)}</span>
                      ${l.tag ? `<em class="pill">${l.tag}</em>` : ""}
                      ${ARROW}
                    </a>
                    ${l.code ? `<button type="button" class="code-btn" data-snippet="${key}" title="View Verilog code" aria-label="View code for ${esc(l.label)}">&lt;/&gt;</button>` : ""}
                  </div>`;
                }).join("")}
              </div>
            </div>`).join("")}
        </div>
      </section>`).join("");

    $("#navLinks").innerHTML =
      `<a href="#generator">Generator</a>` +
      LIBRARY.map((s) => `<a href="#${s.id}">${esc(s.nav)}</a>`).join("");
  }

  /* ---------- Code viewer dialog ---------- */
  function setupViewer() {
    const dlg = $("#codeDialog");
    let current = "";
    $("#library").addEventListener("click", (e) => {
      const b = e.target.closest("[data-snippet]");
      if (!b) return;
      const sn = snippets[b.dataset.snippet];
      current = sn.code;
      $("#dialogTitle").textContent = sn.title;
      $("#dialogCode code").innerHTML = highlight(sn.code);
      dlg.showModal();
    });
    $("#dialogClose").addEventListener("click", () => dlg.close());
    $("#dialogCopy").addEventListener("click", () => copyText(current));
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // backdrop
  }

  /* ---------- Search ---------- */
  function setupSearch() {
    const input = $("#searchInput");
    const count = $("#resultCount");
    const total = document.querySelectorAll(".link").length;

    const run = () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      document.querySelectorAll("[data-section]").forEach((sec) => {
        let secHits = 0;
        sec.querySelectorAll("[data-group]").forEach((grp) => {
          let hits = 0;
          grp.querySelectorAll(".link-row").forEach((row) => {
            const match = !q || row.querySelector(".link").dataset.search.includes(q);
            row.hidden = !match;
            if (match) hits++;
          });
          grp.hidden = hits === 0;
          secHits += hits;
        });
        sec.hidden = secHits === 0;
        shown += secHits;
      });
      count.textContent = q ? `${shown} / ${total} programs` : `${total} programs`;
      $("#emptyState").hidden = shown !== 0;
    };

    input.addEventListener("input", run);
    document.addEventListener("keydown", (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if (e.key === "/" && !typing) { e.preventDefault(); input.focus(); }
      if (e.key === "Escape" && document.activeElement === input) { input.value = ""; run(); input.blur(); }
    });
    run();
  }

  /* ---------- Analysis views ---------- */
  const GROUP_COLORS = ["#34d399", "#22d3ee", "#fbbf24", "#f472b6", "#a78bfa", "#fb923c", "#60a5fa", "#f87171"];
  const GRAY = [0, 1, 3, 2];
  const GRAY_BITS = ["00", "01", "11", "10"];

  function renderTruthTable(rows) {
    $("#truthTable").innerHTML =
      `<thead><tr><th>m</th><th>A</th><th>B</th><th>C</th><th>D</th><th>F</th></tr></thead><tbody>` +
      rows.map((r) => `<tr class="${r.F ? "on" : ""}"><td>${r.m}</td><td>${r.A}</td><td>${r.B}</td><td>${r.C}</td><td>${r.D}</td><td><b>${r.F}</b></td></tr>`).join("") +
      `</tbody>`;
  }

  function renderKmap(res) {
    const on = new Set(res.minterms);
    const groups = res.min.terms;
    let html = `<table class="km"><thead><tr><th class="corner"><span>AB</span><span>CD</span></th>${GRAY_BITS.map((b) => `<th>${b}</th>`).join("")}</tr></thead><tbody>`;
    GRAY.forEach((r, ri) => {
      html += `<tr><th>${GRAY_BITS[ri]}</th>`;
      GRAY.forEach((c) => {
        const m = r * 4 + c;
        const dots = groups
          .map((g, gi) => (g.allCells.includes(m) ? `<i style="background:${GROUP_COLORS[gi % GROUP_COLORS.length]}"></i>` : ""))
          .join("");
        html += `<td class="${on.has(m) ? "on" : ""}"><b>${on.has(m) ? 1 : 0}</b><small>${m}</small><span class="dots">${dots}</span></td>`;
      });
      html += `</tr>`;
    });
    $("#kmap").innerHTML = html + `</tbody></table>`;

    $("#kLegend").innerHTML = groups
      .map((g, gi) => `<li><i style="background:${GROUP_COLORS[gi % GROUP_COLORS.length]}"></i><code>${esc(g.math)}</code><span>group of ${g.size}</span></li>`)
      .join("");
  }

  function renderMin(res) {
    const t = res.min.terms;
    $("#minExpr").textContent = "F = " + res.min.expr;
    $("#minStat").textContent =
      `${res.minterms.length} minterm${res.minterms.length > 1 ? "s" : ""} → ${t.length} product term${t.length > 1 ? "s" : ""}, ${res.min.literals} literal${res.min.literals === 1 ? "" : "s"}.`;
    $("#minTerms").innerHTML = t
      .map((g, gi) => `<li><i style="background:${GROUP_COLORS[gi % GROUP_COLORS.length]}"></i><code>${esc(g.math)}</code><span>covers m${g.cells.join(", m")}</span></li>`)
      .join("");
  }

  /* ---------- Generator ---------- */
  function setupGenerator() {
    const form = $("#genForm");
    const reg = $("#regNumber");
    const out = $("#output code");
    const seg = $("#logicSeg");
    let type = "SL";
    let current = { code: "", file: "output.v" };

    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-type]");
      if (!b) return;
      type = b.dataset.type;
      seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", x === b));
      if (reg.value.trim()) form.requestSubmit();
    });
    ["withTb", "useMin"].forEach((id) =>
      $("#" + id).addEventListener("change", () => reg.value.trim() && form.requestSubmit()));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const r = VerilogGen.generate(reg.value, type, $("#withTb").checked, $("#useMin").checked);
      if (!r.ok) {
        reg.classList.add("shake");
        setTimeout(() => reg.classList.remove("shake"), 400);
        toast(r.error, "err");
        return;
      }
      current = { code: r.code, file: r.file };
      out.innerHTML = highlight(r.code);
      $("#fileName").textContent = r.file;

      $("#chips").innerHTML = r.minterms.map((m) => `<span class="chip">m${m}</span>`).join("");
      $("#sop").textContent = r.sop;
      $("#mintermBox").hidden = false;

      renderTruthTable(r.table);
      renderKmap(r);
      renderMin(r);
      $("#analysis").hidden = false;
    });

    $("#copyButton").addEventListener("click", () => {
      if (!current.code) return toast("Generate some code first.", "err");
      copyText(current.code);
    });

    $("#downloadButton").addEventListener("click", () => {
      if (!current.code) return toast("Generate some code first.", "err");
      const url = URL.createObjectURL(new Blob([current.code], { type: "text/plain" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: current.file });
      a.click();
      URL.revokeObjectURL(url);
      toast(`Saved ${current.file}`);
    });
  }

  /* ---------- Init ---------- */
  setupTheme();
  renderLibrary();
  setupViewer();
  setupSearch();
  setupGenerator();
})();
