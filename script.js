// Function to Determine Minterms from Registration Number
function determineMinterms(regNumber) {
    const minterms = [];
    const mapping = {
        'A': [10], 'B': [11], 'C': [12], 'D': [13], 'E': [14], 'F': [15],
        'a': [10], 'b': [11], 'c': [12], 'd': [13], 'e': [14], 'f': [15]
    };

    // Normalize registration number to uppercase
    regNumber = regNumber.toUpperCase();

    // Check for mapped letters
    for (const [key, values] of Object.entries(mapping)) {
        if (regNumber.includes(key)) {
            minterms.push(...values);
        }
    }

    // Check for digits
    for (let i = 0; i <= 9; i++) {
        if (regNumber.includes(i.toString())) {
            minterms.push(i);
        }
    }

    // Remove duplicates and ensure range is valid (0-15)
    return [...new Set(minterms)].filter(m => m >= 0 && m < 16);
}

// Generate Structural Verilog Code
function generateStructuralVerilog(regNumber) {
    const minterms = determineMinterms(regNumber);
    if (minterms.length === 0) return "// No valid minterms found for Structural Logic.";

    let verilogCode = `module gate_logic(\n`;
    verilogCode += `    input A, B, C, D,\n`;
    verilogCode += `    output F\n);\n\n`;

    verilogCode += `    wire ${minterms.map(m => `m${m}`).join(', ')};\n\n`;

    minterms.forEach(m => {
        const binary = m.toString(2).padStart(4, '0');
        verilogCode += `    and AND_${m}(m${m}, ${binary[0] === '1' ? 'A' : '~A'}, `;
        verilogCode += `${binary[1] === '1' ? 'B' : '~B'}, ${binary[2] === '1' ? 'C' : '~C'}, ${binary[3] === '1' ? 'D' : '~D'});\n`;
    });

    verilogCode += `\n    or OR_F(F, ${minterms.map(m => `m${m}`).join(', ')});\n`;
    verilogCode += `endmodule\n`;

    return verilogCode;
}

// Generate Dataflow Verilog Code
function generateDataFlowVerilog(regNumber) {
    const minterms = determineMinterms(regNumber);
    if (minterms.length === 0) return "// No valid minterms found for Dataflow Logic.";

    let verilogCode = `module logic_function(\n`;
    verilogCode += `    input A, B, C, D,\n`;
    verilogCode += `    output F\n);\n\n`;

    verilogCode += `    assign F = \n        `;

    const terms = minterms.map(m => {
        const binary = m.toString(2).padStart(4, '0');
        return `(${binary[0] === '1' ? 'A' : '~A'} & ${binary[1] === '1' ? 'B' : '~B'} & ${binary[2] === '1' ? 'C' : '~C'} & ${binary[3] === '1' ? 'D' : '~D'})`;
    }).join(' | \n        ');

    verilogCode += terms + ";\n";
    verilogCode += `endmodule\n`;

    return verilogCode;
}

// Generate Behavioral Verilog Code
function generateBehavioralVerilog(regNumber) {
    const minterms = determineMinterms(regNumber);
    if (minterms.length === 0) return "// No valid minterms found for Behavioral Logic.";

    let verilogCode = `module behavioral_logic(\n`;
    verilogCode += `    input A, B, C, D,\n`;
    verilogCode += `    output reg F\n);\n\n`;

    verilogCode += `    always @(A or B or C or D) begin\n`;
    verilogCode += `        case ({A, B, C, D})\n`;

    minterms.forEach(m => {
        const binary = m.toString(2).padStart(4, '0');
        verilogCode += `            4'b${binary}: F = 1; // Minterm ${m}\n`;
    });

    verilogCode += `            default: F = 0;\n`;
    verilogCode += `        endcase\n`;
    verilogCode += `    end\n`;
    verilogCode += `endmodule\n`;

    return verilogCode;
}

// Corrected Logic Type Selection to Generate Outputs
document
  .getElementById("generateButton")
  .addEventListener("click", (e) => {
    e.preventDefault();
    const regNumber = document.getElementById("regNumber").value.trim();
    const logicType = document
      .getElementById("logicType")
      .value.trim()
      .toUpperCase(); // Ensure input is uppercase

    if (!regNumber) {
      alert("Please enter a valid registration number.");
      return;
    }

    let verilogCode;
    if (logicType === "SL") {
      verilogCode = generateStructuralVerilog(regNumber);
    } else if (logicType === "DFL") {
      verilogCode = generateDataFlowVerilog(regNumber);
    } else if (logicType === "BL") {
      verilogCode = generateBehavioralVerilog(regNumber);
    } else {
      alert("Invalid logic type! Please select SL, DFL, or BL.");
      return;
    }

    // Display the generated Verilog code
    document.getElementById("output").textContent = verilogCode;
  });

document.getElementById("copyButton").addEventListener("click", () => {
  const output = document.getElementById("output").textContent;

  if (!output || output === "Generated Verilog code will appear here...") {
    alert("Nothing to copy! Please generate the Verilog code first.");
    return;
  }

  // Copy the text to the clipboard
  navigator.clipboard
    .writeText(output)
    .then(() => {
      alert("Code copied to clipboard!");
    })
    .catch((err) => {
      alert("Failed to copy the code. Please try again.");
      console.error("Clipboard copy failed:", err);
    });
});