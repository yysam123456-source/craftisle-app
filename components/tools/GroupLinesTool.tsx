"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Group Lines (Chunk)
 * Group lines into chunks of N items
 */
export default function GroupLinesTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [chunkSize, setChunkSize] = useState(3);
  const [separator, setSeparator] = useState("\n");
  const [chunkSeparator, setChunkSeparator] = useState("\n\n");
  const [leftWrap, setLeftWrap] = useState("");
  const [rightWrap, setRightWrap] = useState("");
  const [padNonFull, setPadNonFull] = useState(false);
  const [padChar, setPadChar] = useState("");

  const handleGroup = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    let items = input.split(separator);
    const chunks: string[][] = [];

    // Split into chunks
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    // Pad non-full chunk if requested
    if (padNonFull && chunks.length > 0) {
      const lastChunk = chunks[chunks.length - 1];
      while (lastChunk.length < chunkSize) {
        lastChunk.push(padChar);
      }
    }

    // Format output
    const result = chunks.map(chunk => {
      return leftWrap + chunk.join(" ") + rightWrap;
    });

    setOutput(result.join(chunkSeparator));
  };

  return (
    <TextToolLayout
      title="Group Lines (Chunk)"
      description="Group lines into chunks of N items"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleGroup}
      processLabel="Group"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Chunk Size</label>
            <input
              type="number"
              value={chunkSize}
              onChange={(e) => setChunkSize(Math.max(1, parseInt(e.target.value, 10)))}
              min={1}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Item Separator</label>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="\n">Newline</option>
              <option value=",">Comma</option>
              <option value=" ">Space</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Chunk Separator</label>
            <select
              value={chunkSeparator}
              onChange={(e) => setChunkSeparator(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="\n\n">Double newline</option>
              <option value="\n">Newline</option>
              <option value=",">Comma</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Left Wrap</label>
              <input
                type="text"
                value={leftWrap}
                onChange={(e) => setLeftWrap(e.target.value)}
                placeholder="["
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Right Wrap</label>
              <input
                type="text"
                value={rightWrap}
                onChange={(e) => setRightWrap(e.target.value)}
                placeholder="]"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={padNonFull}
              onChange={(e) => setPadNonFull(e.target.checked)}
            />
            <span className="text-sm">Pad non-full chunks</span>
          </label>

          {padNonFull && (
            <div>
              <label className="block text-sm font-medium mb-2">Padding Character</label>
              <input
                type="text"
                value={padChar}
                onChange={(e) => setPadChar(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}
        </div>
      }
    />
  );
}
