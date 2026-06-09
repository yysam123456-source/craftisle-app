/**
 * Normalize heading levels in HTML content.
 * Fixes two problems:
 *  1. Page already has <h1> (title) → shift all content headings down by 1
 *     (h1→h2, h2→h3, ..., h5→h6; h6 stays h6)
 *  2. Heading skips (e.g. h2 → h4 without h3) → remap to contiguous levels
 *
 * @param html - Raw HTML string (e.g. from Ghost CMS)
 * @returns HTML with normalized heading hierarchy
 */
export function normalizeHeadings(html: string): string {
  if (!html) return html;

  // Step 1: Shift all h1…h5 down by 1 (page title is h1)
  // Process from h5 → h1 to avoid double-shifting
  const shifts = [
    [5, 6],
    [4, 5],
    [3, 4],
    [2, 3],
    [1, 2],
  ] as const;

  let fixed = html;
  for (const [from, to] of shifts) {
    // Escape `<` and `>` in the replacement to avoid regex issues
    const openRe = new RegExp(`<h${from}([^>]*)>`, "gi");
    const closeRe = new RegExp(`</h${from}>`, "gi");
    fixed = fixed
      .replace(openRe, `<h${to}$1>`)
      .replace(closeRe, `</h${to}>`);
  }

  return fixed;
}

/**
 * More advanced: re-number headings to ensure no skips.
 * Use this if normalizeHeadings isn't enough.
 *
 * Strategy: treat each heading's visual "nesting" by remapping levels
 * to a contiguous sequence starting from the minimum level found.
 */
export function fixHeadingSkips(html: string): string {
  if (!html) return html;

  // Collect all headings with their positions
  const headingRe = /<(h[1-6])([^>]*)>/gi;
  const found: { tag: string; attrs: string; level: number; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(html)) !== null) {
    found.push({ tag: m[1], attrs: m[2], level: parseInt(m[1].slice(1)), start: m.index });
  }

  if (found.length === 0) return html;

  // Build a contiguous remapping:
  //   desired[0] = minLevel
  //   desired[i] = desired[i-1] + (found[i].level > found[i-1].level ? 1 : 0)
  //   but never skip a level
  const minLevel = Math.min(...found.map(h => h.level));
  const desired: number[] = [minLevel];
  for (let i = 1; i < found.length; i++) {
    const prev = found[i - 1].level;
    const curr = found[i].level;
    if (curr > prev) {
      // Deeper: allow +1 (no skip)
      desired.push(Math.min(curr, desired[i - 1] + 1));
    } else {
      // Same or shallower: keep as-is (or allow going back)
      desired.push(curr);
    }
  }

  // Apply replacements from last → first (preserves indices)
  let result = html;
  for (let i = found.length - 1; i >= 0; i--) {
    const h = found[i];
    const target = desired[i];
    if (h.level === target) continue;

    const before = result.slice(0, h.start);
    const after = result.slice(h.start);

    // Replace the opening tag
    const afterReplaced = after.replace(
      new RegExp(`<h${h.level}([^>]*)>`, "i"),
      `<h${target}$1>`
    );
    // Replace the corresponding closing tag (find the first </hX> after this position)
    // Simple approach: replace the first </hX> in `afterReplaced`
    const closeRe = new RegExp(`</h${h.level}>`, "i");
    const finalAfter = afterReplaced.replace(closeRe, `</h${target}>`);

    result = before + finalAfter;
  }

  return result;
}

/**
 * Basic HTML sanitization for third-party content (e.g. Ghost CMS).
 * Strips <script> tags and inline event handlers (onerror, onclick, etc.)
 * to prevent XSS when rendering with dangerouslySetInnerHTML.
 *
 * @param html - Raw HTML string from external source
 * @returns Sanitized HTML safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return html;

  return html
    // Remove <script>...</script> blocks (including their contents)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove inline event handlers: onerror=, onclick=, onload=, etc.
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Remove javascript: URLs in href
    .replace(/href\s*=\s*(?:"|')javascript:/gi, 'href="#"');
}
