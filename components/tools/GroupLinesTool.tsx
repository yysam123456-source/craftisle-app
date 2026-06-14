"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Group Lines
 * Group list items into chunks
 */
export default function GroupLinesTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [separator, setSeparator] = useState(",");
  const [groupSize, setGroupSize] = useState(3);
  const [groupSeparator, setGroupSeparator] = useState("\n");
  const [itemSeparator, setItemSeparator] = useState(",");
  const [leftWrap, setLeftWrap] = useState("");
  const [rightWrap, setRightWrap] = useState("");
  const [padNonFull, setPadNonFull] = useState(false);
  const [padChar, setPadChar] = useState("");

  const handleGroup = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      let items = input.split(separator).map(s => s.trim()).filter(s => s);
      
      // Pad non-full group
      if (padNonFull && items.length > 0) {
        const remainder = items.length % groupSize;
        if (remainder > 0) {
          const paddingNeeded = groupSize - remainder;
          for (let i = 0; i < paddingNeeded; i++) {
            items.push(padChar);
          }
        }
      }

      // Group items
      const groups: string[] = [];
      for (let i = 0; i < items.length; i += groupSize) {
        const group = items.slice(i, i + groupSize);
        groups.push(leftWrap + group.join(itemSeparator) + rightWrap);
      }

      setOutput(groups.join(groupSeparator));
    } catch {
      setOutput("❌ Error grouping lines. Check format.");
    }
  };

  return (
    <TextToolLayout
      title="Group Lines"
      description="Group list items into chunks"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleGroup}
      processLabel="Group"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Item Separator</label>
            <input
              type="text"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Group Size</label>
            <input
              type="number"
              value={groupSize}
              onChange={(e) => setGroupSize(Math.max(1, parseInt(e.target.value, 10)))}
              min={1}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Item Separator (within group)</label>
            <input
              type="text"
              value={itemSeparator}
              onChange={(e) => setItemSeparator(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Left Wrap</label>
              <input
                type="text"
                value={leftWrap}
                onChange={(e) => setLeftWrap(e.target.value)}
                placeholder="e.g., ("
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Right Wrap</label>
              <input
                type="text"
                value={rightWrap}
                onChange={(e) => setRightWrap(e.target.value)}
                placeholder="e.g., )"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Group Separator</label>
            <input
              type="text"
              value={groupSeparator}
              onChange={(e) => setGroupSeparator(e.target.value)}
              placeholder="\n for newline"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={padNonFull}
              onChange={(e) => setPadNonFull(e.target.checked)}
            />
            <span className="text-sm">Pad non-full groups</span>
          </label>

          {padNonFull && (
            <div>
              <label className="block text-sm font-medium mb-2">Padding Character</label>
              <input
                type="text"
                value={padChar}
                onChange={(e) => setPadChar(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Groups items into chunks of specified size.</p>
            <p>Supports custom separators, wrapping, and padding.</p>
          </div>
        </div>
      }
    />
  );
}
