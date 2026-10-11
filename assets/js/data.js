/* ==========================================================
   Lab library data — add / edit programs here, UI updates
   automatically. No HTML changes needed.
   ========================================================== */

const jd = (id) => `https://www.jdoodle.com/a/${id}`;
const colab = (id) => `https://colab.research.google.com/drive/${id}?usp=sharing`;

/* ----------------------------------------------------------
   Schema
   section: { id, nav, num, title, desc, groups[] }
   group  : { name, note?, links[] }
   link   : { label, url, tag?, code? }
              └ code (optional string) adds a "view code" button that
                opens the Verilog in a pop-up viewer on the page.
   ---------------------------------------------------------- */
const LIBRARY = [
  {
    id: "assigned",
    nav: "Assigned",
    num: "02",
    title: "Assigned programs",
    desc: "BCD, Excess-N and Mod-N counters (Colab notebooks).",
    groups: [
      {
        name: "Colab notebooks", note: "Notebooks with the programs assigned to this registration number.",
        links: [
          { label: "Assigned BCD",            url: colab("1mpPklcnYkHCsqPSy-XHvZL9PDbrlxqdr") },
          { label: "Assigned Excess-N Counter", url: colab("15nBSucJgRYgC2leWKGNZ5P_lU_ISmU5s") },
          { label: "Assigned Mod-N Counter",    url: colab("1jfXkjwQ_VIHnXjzUnz_hdakd4N5Teyi2") },
        ],
      },
    ],
  },
  {
    id: "basics",
    nav: "Adders & Subtractors",
    num: "03",
    title: "HA · FA · HS · FS",
    desc: "Half/full adders and subtractors in all three modelling styles.",
    groups: [
      { name: "Half Adder (HA)", note: `Sum = A ⊕ B   ·   Carry = A·B`,        links: [
        { label: "Dataflow",   url: jd("8Hsk"), code: `module half_adder (input a, b, output sum, carry);
    assign sum   = a ^ b;
    assign carry = a & b;
endmodule`, tag: "DFL" },
        { label: "Behavioral", url: jd("8Ht3"), code: `module half_adder (input a, b, output reg sum, carry);
    always @(*) begin
        sum   = a ^ b;
        carry = a & b;
    end
endmodule`, tag: "BL"  },
        { label: "Structural", url: jd("8HsR"), code: `module half_adder (input a, b, output sum, carry);
    xor X1 (sum, a, b);
    and A1 (carry, a, b);
endmodule`, tag: "SL"  } ] },
      { name: "Full Adder (FA)", note: `Sum = A ⊕ B ⊕ Cin   ·   Cout = AB + Cin(A ⊕ B)`,        links: [
        { label: "Dataflow",   url: jd("8Hti"), code: `module full_adder (input a, b, cin, output sum, cout);
    assign sum  = a ^ b ^ cin;
    assign cout = (a & b) | (cin & (a ^ b));
endmodule`, tag: "DFL" },
        { label: "Behavioral", url: jd("8Htk"), code: `module full_adder (input a, b, cin, output reg sum, cout);
    always @(*) begin
        {cout, sum} = a + b + cin;
    end
endmodule`, tag: "BL"  },
        { label: "Structural", url: jd("8Hto"), code: `module full_adder (input a, b, cin, output sum, cout);
    wire x1, a1, a2;
    xor X1 (x1, a, b);
    xor X2 (sum, x1, cin);
    and A1 (a1, a, b);
    and A2 (a2, x1, cin);
    or  O1 (cout, a1, a2);
endmodule`, tag: "SL"  } ] },
      { name: "Half Subtractor (HS)", note: `Diff = A ⊕ B   ·   Borrow = A'·B`,   links: [
        { label: "Dataflow",   url: jd("8Hts"), tag: "DFL" },
        { label: "Behavioral", url: jd("8Htw"), tag: "BL"  },
        { label: "Structural", url: jd("8Htx"), tag: "SL"  } ] },
      { name: "Full Subtractor (FS)", note: `Diff = A ⊕ B ⊕ Bin   ·   Bout = A'B + Bin(A ⊕ B)'`,   links: [
        { label: "Dataflow",   url: jd("8HtE"), tag: "DFL" },
        { label: "Behavioral", url: jd("8HtI"), tag: "BL"  },
        { label: "Structural", url: jd("8HtM"), tag: "SL"  } ] },
    ],
  },
  {
    id: "mux",
    nav: "MUX & Boolean",
    num: "04",
    title: "MUX & Boolean expressions",
    desc: "Multiplexer builds, function realisation and MUX-based arithmetic.",
    groups: [
      { name: "MUX implementation", note: `Select lines = log₂(inputs): 2:1 → 1, 4:1 → 2, 32:1 → 5, 64:1 → 6.`, links: [
        { label: "64:1 MUX", url: jd("8Hu8"), tag: "SL"  },
        { label: "32:1 MUX", url: jd("8Hu2"), tag: "DFL" },
        { label: "4:1 MUX",  url: jd("8Hu0"), tag: "BL"  },
        { label: "2:1 MUX",  url: jd("8HtQ") } ] },
      { name: "Boolean expressions", note: `An n-variable function fits a 2ⁿ:1 MUX, or an OR over decoder outputs.`, links: [
        { label: "Using 16:1 MUX",     url: jd("8HFe") },
        { label: "Using 4:16 Decoder", url: jd("8HFi") } ] },
      { name: "Adder / Subtractor with MUX", note: `Drive the select lines with the inputs; tie data pins to 0, 1, C or C'.`, links: [
        { label: "HA using 4:1 MUX", url: jd("8HFn") },
        { label: "FA using 8:1 MUX", url: jd("8HFr") },
        { label: "HS using 2:1 MUX", url: jd("8HFa") } ] },
    ],
  },
  {
    id: "arith",
    nav: "Adder · Multiplier",
    num: "05",
    title: "Comparator, adder & multiplier",
    desc: "Multi-bit arithmetic building blocks.",
    groups: [
      { name: "Arithmetic", note: `Subtraction reuses the adder by XOR-ing B with a mode bit and using it as carry-in.`, links: [
        { label: "1-bit Comparator",  url: jd("8Ih3") },
        { label: "4-bit Adder (SL)",  url: jd("8Ikp"), tag: "SL" },
        { label: "4-bit Adder / Sub", url: jd("8Ikq") },
        { label: "4-bit Multiplier",  url: jd("8Ikr") } ] },
    ],
  },
  {
    id: "alu",
    nav: "ALU & Booth",
    num: "06",
    title: "ALU & Booth multiplier",
    desc: "From a single-bit ALU up to a 32-bit datapath.",
    groups: [
      { name: "ALU", note: `Opcode-driven datapath: arithmetic and logic results multiplexed onto one bus.`, links: [
        { label: "1-bit ALU",  url: jd("8HFA") },
        { label: "4-bit ALU",  url: jd("8HFB") },
        { label: "8-bit ALU",  url: jd("8HFC") },
        { label: "32-bit ALU", url: jd("8HFF") } ] },
      { name: "Multiplier", note: `Radix-2 Booth recodes multiplier bit pairs into add / subtract / skip steps.`, links: [
        { label: "4-bit Booth Multiplier", url: jd("8HFG") } ] },
    ],
  },
  {
    id: "seq",
    nav: "Counters & Registers",
    num: "07",
    title: "Counters & registers",
    desc: "Shift registers and synchronous / asynchronous counters.",
    groups: [
      { name: "Registers & special counters", note: `Ring: one-hot circulates (n states). Johnson: inverted feedback (2n states).`, links: [
        { label: "Bi-directional Shift Register", url: jd("8HuQ") },
        { label: "Up/Down Gray Counter",          url: jd("8HuT") },
        { label: "Ring Counter",                  url: jd("8HuZ") },
        { label: "Johnson Counter",               url: jd("8Hv2") } ] },
      { name: "4-bit Up/Down counters", note: `Async (ripple) chains clocks; sync shares one clock: faster and glitch-free.`, links: [
        { label: "Asynchronous", url: jd("8HXh") },
        { label: "Synchronous",  url: jd("8HXj") } ] },
      { name: "Up/Down random counters", note: `Step through a custom state sequence instead of plain binary order.`, links: [
        { label: "Synchronous",  url: jd("8HXp") },
        { label: "Asynchronous", url: jd("8HXq") } ] },
    ],
  },
];
