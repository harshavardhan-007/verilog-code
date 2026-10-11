/* ==========================================================
   Verilog generator — pure functions, no DOM access.
   F(A,B,C,D) = Σm(...) in Structural / Dataflow / Behavioral,
   plus truth table and Quine–McCluskey minimization.
   ========================================================== */

const VerilogGen = (() => {
  const VARS = ["A", "B", "C", "D"];
  const bin4 = (m) => m.toString(2).padStart(4, "0");
  const safe = (s) => s.replace(/[^A-Za-z0-9]/g, "");

  /** Unique, sorted minterms (0-15) from digits 0-9 and hex letters A-F. */
  function minterms(reg) {
    const set = new Set();
    for (const ch of reg.toUpperCase()) {
      if (ch >= "0" && ch <= "9") set.add(+ch);
      else if (ch >= "A" && ch <= "F") set.add(ch.charCodeAt(0) - 55);
    }
    return [...set].sort((a, b) => a - b);
  }

  /* ---------- Implicants & Quine–McCluskey ---------- */
  // implicant = { value, mask } : bits set in mask are "don't care"
  const covers = (p, m) => ((m & ~p.mask) & 15) === p.value;
  const cellsOf = (p) => Array.from({ length: 16 }, (_, m) => m).filter((m) => covers(p, m));

  /** Literals of an implicant, MSB (A) → LSB (D). */
  function lits(p) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      const bit = 3 - i;
      if ((p.mask >> bit) & 1) continue;
      out.push({ v: VARS[i], neg: ((p.value >> bit) & 1) === 0 });
    }
    return out;
  }
  const vLit = (l) => (l.neg ? "~" : "") + l.v;
  const mLit = (l) => l.v + (l.neg ? "'" : "");

  function primeImplicants(ms) {
    let level = new Map(ms.map((m) => [`0:${m}`, { value: m, mask: 0 }]));
    const primes = [];
    while (level.size) {
      const arr = [...level.values()];
      const used = new Set();
      const next = new Map();
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i], b = arr[j];
          if (a.mask !== b.mask) continue;
          const d = a.value ^ b.value;
          if (d && (d & (d - 1)) === 0) {
            const n = { value: a.value & ~d, mask: a.mask | d };
            next.set(`${n.mask}:${n.value}`, n);
            used.add(i); used.add(j);
          }
        }
      }
      arr.forEach((t, i) => { if (!used.has(i)) primes.push(t); });
      level = next;
    }
    return primes;
  }

  /** Exact minimum cover (fewest terms, then fewest literals). */
  function minimize(ms) {
    if (ms.length === 16) return [{ value: 0, mask: 15 }];
    const primes = primeImplicants(ms);
    let best = null;
    const score = (sel) => [sel.length, sel.reduce((s, p) => s + lits(p).length, 0)];
    const better = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);

    (function search(unc, chosen) {
      if (best && chosen.length > best.sel.length) return;
      if (!unc.length) {
        const sc = score(chosen);
        if (!best || better(sc, best.sc)) best = { sel: [...chosen], sc };
        return;
      }
      const m = unc[0];
      for (const p of primes) {
        if (!covers(p, m)) continue;
        search(unc.filter((x) => !covers(p, x)), [...chosen, p]);
      }
    })(ms, []);

    return best.sel.sort((a, b) => cellsOf(a)[0] - cellsOf(b)[0]);
  }

  /* ---------- Code builders ---------- */
  const productV = (p) => lits(p).map(vLit).join(" & ");
  const productM = (p) => lits(p).map(mLit).join("") || "1";
  const exprV = (items) => items.map(productV).join(" | ");

  function header(reg, style, ms, min, items) {
    const L = [
      `// ------------------------------------------------------------`,
      `// ${style} model  |  Reg No: ${safe(reg)}`,
      `// F(A,B,C,D) = Σm(${ms.join(", ")})`,
    ];
    if (min) L.push(`// Minimized  : F = ${items.map(productM).join(" + ")}`);
    L.push(`// ------------------------------------------------------------`);
    return L.join("\n");
  }

  const names = (items, min) => items.map((p, i) => (min ? `p${i}` : `m${p.value}`));

  function structural(reg, ms, items, min) {
    const L = [header(reg, "Structural", ms, min, items), "module reg_logic_sl (", "    input  A, B, C, D,", "    output F", ");", ""];
    if (items.some((p) => !lits(p).length)) {
      L.push("    // Function is constant 1", "    assign F = 1'b1;", "endmodule");
      return L.join("\n");
    }
    const nm = names(items, min);
    L.push("    // Complemented inputs", "    wire nA, nB, nC, nD;");
    VARS.forEach((v) => L.push(`    not N_${v} (n${v}, ${v});`));
    L.push("", min ? "    // Product terms (prime implicants)" : "    // Minterm AND gates");
    L.push(`    wire ${nm.join(", ")};`);
    items.forEach((p, i) => {
      const sig = lits(p).map((l) => (l.neg ? "n" : "") + l.v);
      L.push(sig.length === 1
        ? `    buf  B_${nm[i]} (${nm[i]}, ${sig[0]});`
        : `    and  AND_${nm[i]} (${nm[i]}, ${sig.join(", ")});`);
    });
    L.push("", "    // Sum of products");
    L.push(nm.length === 1 ? `    buf  OR_F (F, ${nm[0]});` : `    or   OR_F (F, ${nm.join(", ")});`);
    L.push("endmodule");
    return L.join("\n");
  }

  function dataflow(reg, ms, items, min) {
    const terms = items.map((p) => (lits(p).length > 1 ? `(${productV(p)})` : productV(p) || "1'b1"));
    return [
      header(reg, "Dataflow", ms, min, items),
      "module reg_logic_dfl (", "    input  A, B, C, D,", "    output F", ");", "",
      "    assign F =", "        " + terms.join("\n      | ") + ";",
      "endmodule",
    ].join("\n");
  }

  function behavioral(reg, ms, items, min) {
    const L = [header(reg, "Behavioral", ms, min, items), "module reg_logic_bl (", "    input      A, B, C, D,", "    output reg F", ");", ""];
    if (min) {
      const e = items.map((p) => (lits(p).length > 1 ? `(${productV(p)})` : productV(p) || "1'b1")).join(" | ");
      L.push("    always @(*) begin", `        F = ${e};`, "    end");
    } else {
      L.push("    always @(*) begin", "        case ({A, B, C, D})");
      ms.forEach((m) => L.push(`            4'b${bin4(m)}: F = 1'b1;  // m${m}`));
      L.push("            default: F = 1'b0;", "        endcase", "    end");
    }
    L.push("endmodule");
    return L.join("\n");
  }

  function testbench(mod, ms) {
    const truth = ms.reduce((s, m) => s | (1 << m), 0).toString(16).toUpperCase().padStart(4, "0");
    return [
      "",
      "// ------------------------------------------------------------",
      "// Self-checking testbench",
      "// ------------------------------------------------------------",
      "`timescale 1ns/1ps",
      "module tb;",
      "    reg  A, B, C, D;",
      "    wire F;",
      "    integer i, errors;",
      `    localparam [15:0] TRUTH = 16'h${truth};  // expected F for inputs 0..15`,
      "",
      `    ${mod} dut (.A(A), .B(B), .C(C), .D(D), .F(F));`,
      "",
      "    initial begin",
      "        $dumpfile(\"dump.vcd\");",
      "        $dumpvars(0, tb);",
      "        errors = 0;",
      "        $display(\" A B C D | F\");",
      "        for (i = 0; i < 16; i = i + 1) begin",
      "            {A, B, C, D} = i[3:0];",
      "            #10;",
      "            $display(\" %b %b %b %b | %b\", A, B, C, D, F);",
      "            if (F !== TRUTH[i]) begin",
      "                errors = errors + 1;",
      "                $display(\"   ^ MISMATCH at %0d (expected %b)\", i, TRUTH[i]);",
      "            end",
      "        end",
      "        if (errors == 0) $display(\"PASS: all 16 vectors match\");",
      "        else             $display(\"FAIL: %0d mismatches\", errors);",
      "        $finish;",
      "    end",
      "endmodule",
    ].join("\n");
  }

  const STYLES = {
    SL:  { build: structural, mod: "reg_logic_sl" },
    DFL: { build: dataflow,   mod: "reg_logic_dfl" },
    BL:  { build: behavioral, mod: "reg_logic_bl" },
  };

  /**
   * @param {string} reg
   * @param {"SL"|"DFL"|"BL"} type
   * @param {boolean} withTb   append self-checking testbench
   * @param {boolean} useMin   build the hardware from the minimized expression
   */
  function generate(reg, type, withTb, useMin) {
    reg = (reg || "").trim();
    if (!reg) return { ok: false, error: "Enter a registration number first." };
    const style = STYLES[type];
    if (!style) return { ok: false, error: "Pick a logic style." };
    const ms = minterms(reg);
    if (!ms.length) return { ok: false, error: "No digits 0-9 or letters A-F found in that input." };

    const cover = minimize(ms);
    const items = useMin ? cover : ms.map((m) => ({ value: m, mask: 0 }));
    let code = style.build(reg, ms, items, useMin);
    if (withTb) code += "\n" + testbench(style.mod, ms);

    const mset = new Set(ms);
    return {
      ok: true,
      code,
      minterms: ms,
      sop: `F(A,B,C,D) = Σm(${ms.join(", ")})`,
      file: `${safe(reg).toUpperCase()}_${type}${useMin ? "_min" : ""}.v`,
      table: Array.from({ length: 16 }, (_, m) => ({
        m, A: (m >> 3) & 1, B: (m >> 2) & 1, C: (m >> 1) & 1, D: m & 1, F: mset.has(m) ? 1 : 0,
      })),
      min: {
        terms: cover.map((p) => ({ math: productM(p), verilog: productV(p) || "1'b1", cells: cellsOf(p).filter((c) => mset.has(c)), size: cellsOf(p).length, literals: lits(p).length, allCells: cellsOf(p) })),
        expr: cover.map(productM).join(" + "),
        literals: cover.reduce((s, p) => s + lits(p).length, 0),
      },
    };
  }

  return { generate, minterms, minimize };
})();
