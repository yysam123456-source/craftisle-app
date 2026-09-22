/**
 * RFC 4180 风格的「单行」分隔符切分。
 *
 * 为什么不用 `line.split(delimiter)`：
 *   CSV 里 `"Smith, John",42` 这种带引号的字段，内层逗号是数据不是分隔符。
 *   朴素 split 会把它切成两列，用户拿到的"转换成功"结果是错的 —— 而
 *   CsvToTsvTool 的界面当时恰恰写着 "Handles quoted values correctly"。
 *
 * 支持：双引号包裹、字段内分隔符、`""` 转义为一个字面量引号。
 * 不负责换行：调用方按行切分后再逐行调用本函数（CRLF 也由调用方去掉）。
 */
export function splitDelimitedLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++; // 吃掉转义用的第二个引号
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field === "") {
      // 只在字段起始位置的引号才开启引用态（`a"b` 里的引号是普通字符）
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }

  out.push(field);
  return out;
}

/** 把字段重新序列化为带引号的 CSV 字段（仅在必要时加引号）。 */
export function encodeDelimitedField(value: string, delimiter: string): string {
  const needsQuotes =
    value.includes(delimiter) || value.includes('"') || value.includes("\n") || value.includes("\r");
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/** 归一化输入：统一换行、去掉行尾空白留下的空行。 */
export function normalizeLines(input: string): string[] {
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l) => l.trim() !== "");
}
