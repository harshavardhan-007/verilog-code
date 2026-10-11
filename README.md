# Verilog Lab · Code Generator

A themed Verilog code generator plus a searchable library of lab programs.
Plain HTML, CSS and JS: no build step, deploys straight to GitHub Pages.

## Features
- **Generator**: registration number → minterms → `F(A,B,C,D)` in **Structural, Dataflow or Behavioral** Verilog
- **Minimization**: Quine–McCluskey simplification; optionally build the hardware from the minimized expression
- **Analysis views**: truth table, colour-grouped Karnaugh map, minimized expression with literal counts
- **Self-checking testbench**: optional, compares all 16 vectors against the expected truth table and prints PASS/FAIL
- **Copy / download** the generated `.v` file, with Verilog syntax highlighting
- **Light / dark theme** toggle (remembers your choice)
- **Searchable library** (press `/`), per-group notes and an inline code viewer

## Structure
```
index.html
assets/
  css/styles.css
  js/data.js        # lab links, notes and optional inline code
  js/generator.js   # Verilog generation, QM minimizer, testbench
  js/app.js         # UI wiring
```

## Adding / editing programs
Edit `assets/js/data.js` only:
```js
{ name: "Half Adder (HA)", note: "Sum = A ⊕ B · Carry = A·B", links: [
    { label: "Dataflow", url: jd("8Hsk"), tag: "DFL",
      code: `module half_adder (...); ... endmodule` }   // code is optional → adds a </> button
]}
```

## Run locally
Extract the folder, then open `index.html`, or run `python3 -m http.server`.
