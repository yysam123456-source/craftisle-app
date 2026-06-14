"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

/**
 * XML Beautifier
 * Format and validate XML
 */
export default function XmlBeautifierTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleFormat = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const parser = new XMLParser();
      const obj = parser.parse(input);
      const builder = new XMLBuilder({ format: true, indentBy: "  " });
      const formatted = builder.build(obj);
      setOutput(formatted);
    } catch {
      setOutput("❌ Invalid XML format");
    }
  };

  return (
    <TextToolLayout
      title="XML Beautifier"
      description="Format and validate XML"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleFormat}
      processLabel="Format"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Paste XML to format and validate.</p>
          <p>Uses fast-xml-parser library.</p>
        </div>
      }
    />
  );
}
