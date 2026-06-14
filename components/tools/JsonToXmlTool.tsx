"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * JSON to XML Converter
 * Convert JSON data to XML format
 */
export default function JsonToXmlTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [rootName, setRootName] = useState("data");
  const [itemName, setItemName] = useState("item");

  const jsonToXml = (obj: any, indent: number = 2): string => {
    const spaces = " ".repeat(indent);
    
    if (Array.isArray(obj)) {
      return obj.map((item, i) => 
        `<${itemName}>\n${spaces}  <value>${item}</value>\n${spaces}</${itemName}>`
      ).join("\n");
    }

    if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj).map(([key, value]) => {
        if (Array.isArray(value)) {
          return `<${key}>\n${value.map(v => `  <item>${v}</item>`).join("\n")}\n</${key}>`;
        }
        return `<${key}>${value}</${key}>`;
      }).join("\n");
    }

    return String(obj);
  };

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const json = JSON.parse(input);
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<${rootName}>\n`;
      xml += jsonToXml(json, 2);
      xml += `\n</${rootName}>`;
      
      setOutput(xml);
    } catch {
      setOutput("❌ Invalid JSON format");
    }
  };

  return (
    <TextToolLayout
      title="JSON to XML Converter"
      description="Convert JSON data to XML format"
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
