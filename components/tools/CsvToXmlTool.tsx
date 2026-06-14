"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * CSV to XML Converter
 * Convert CSV data to XML format
 */
export default function CsvToXmlTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [rootName, setRootName] = useState("data");
  const [itemName, setItemName] = useState("item");

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = input.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        setOutput("❌ CSV must have at least a header row and one data row");
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1);

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<${rootName}>\n`;
      
      rows.forEach(row => {
        const cells = row.split(",").map(cell => cell.trim().replace(/^"|"$/g, ""));
        xml += `  <${itemName}>\n`;
        headers.forEach((header, i) => {
          const value = cells[i] || "";
          xml += `    <${header}>${value}</${header}>\n`;
        });
        xml += `  </${itemName}>\n`;
      });
      
      xml += `</${rootName}>`;
      
      setOutput(xml);
    } catch {
      setOutput("❌ Error converting CSV to XML");
    }
  };

  return (
    <TextToolLayout
      title="CSV to XML Converter"
      description="Convert CSV data to XML format"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Root Element Name</label>
            <input
              type="text"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Item Element Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      }
    />
  );
}
