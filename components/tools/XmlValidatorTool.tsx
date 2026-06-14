"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";
import { XMLValidator } from "fast-xml-parser";

/**
 * XML Validator
 * Validate XML format
 */
export default function XmlValidatorTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleValidate = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const valid = XMLValidator.validate(input);
      
      if (valid === true) {
        setOutput("✓ Valid XML");
      } else {
        const error = valid as { err: { msg: string; line: number; col: number } };
        setOutput(`❌ Invalid XML:\n${error.err.msg}\nLine: ${error.err.line}, Column: ${error.err.col}`);
      }
    } catch {
      setOutput("❌ Invalid XML format");
    }
  };

  return (
    <TextToolLayout
      title="XML Validator"
      description="Validate XML format"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleValidate}
      processLabel="Validate"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Paste XML to validate.</p>
          <p>Shows line and column of errors.</p>
        </div>
      }
    />
  );
}
