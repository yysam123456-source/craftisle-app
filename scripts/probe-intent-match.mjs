// 验证 growth-review 收紧后的 intentTerms 匹配算法
function stem(w) {
  return w
    .toLowerCase()
    .replace(/(ies)$/, "y")
    .replace(/(sses)$/, "ss")
    .replace(/([^s])s$/, "$1");
}

function buildRegex(term) {
  const parts = term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 2)
    .map((w) => stem(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  buildRegex.parts = (t) => parts;
  if (parts.length === 0) return null;
  // 🔴 关键：分隔符不能写成 `(?:\s+\w{1,3}\s+)?`——它要求插入组两侧都带空格，
  // 于是"a b" 这种单空格直接相连的情况匹配不上（实测 4/9 用例失败）。
  // 正确形态：`(?:[\s-]+\w{1,3}[\s-]+|\s+)?` —— 允许直接单空格、允许插入短连接词、允许连字符。
  return new RegExp(`\\b${parts.join("(?:[\\s-]+\\w{1,3}[\\s-]+|[\\s-]+)?")}\\b`);
}

const CASES = [
  ["intellij community edition", "intellij community edition", true],
  ["intellij idea community edition", "intellij community edition", false],
  ["intellij idea community edition", "intellij idea community", true],
  ["free ms project alternative", "free ms project alternative", true],
  ["microsoft project alternative free", "free ms project alternative", false],
  ["png to jpg converter 100kb", "png to jpg converter", true],
  ["sudoku game", "intellij community edition", false],
  ["intellij free", "intellij community edition", false],
  ["free project management software like ms project", "project management software", true],
];

let pass = 0;
for (const [q, term, expect] of CASES) {
  const re = buildRegex(term);
  const norm = q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const got = re ? re.test(norm) : false;
  const ok = got === expect;
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"}  q="${q}"  term="${term}"  期望=${expect}  实得=${got}`);
  if (!ok && process.env.DBG) {
    console.log(`      parts=${JSON.stringify(buildRegex.parts(term))}`);
    console.log(`      regex=${re?.source}`);
    console.log(`      norm ="${norm}"`);
  }
}
console.log(`\n${pass}/${CASES.length} 通过`);
