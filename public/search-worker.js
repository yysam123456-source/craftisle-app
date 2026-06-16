// Web Worker for search (performance optimization)
// This worker handles search computation off the main thread

self.onmessage = function(e) {
  const { resources, query, options } = e.data;
  
  // Perform search
  const results = performSearch(resources, query, options);
  
  // Return results
  self.postMessage({ results });
};

function performSearch(resources, query, options) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  const { limit = 200, sourceFilter, categoryFilter } = options || {};
  
  // Step 1: Filter
  let filtered = resources.filter(r => {
    const text = `${r.name} ${r.url} ${r.description || ""} ${r.categoryName || ""}`.toLowerCase();
    return text.includes(q);
  });
  
  // Step 2: Score and sort
  const scored = filtered.map(r => {
    const score = scoreResource(r, query);
    return { ...r, _score: score.score, _matchReason: score.matchReason };
  });
  
  scored.sort((a, b) => b._score - a._score);
  
  // Step 3: Deduplicate
  const seen = new Map();
  for (const r of scored) {
    const key = r.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing || r._score > existing._score) {
      seen.set(key, r);
    }
  }
  
  return Array.from(seen.values())
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}

function scoreResource(resource, query) {
  const q = query.toLowerCase().trim();
  let score = 0;
  let matchReason = "";
  
  const name = (resource.name || "").toLowerCase();
  const desc = (resource.description || "").toLowerCase();
  const url = (resource.url || "").toLowerCase();
  
  // Exact name match
  if (name === q) {
    score += 50;
    matchReason = "Exact name match";
  }
  // Name contains query
  else if (name.includes(q)) {
    score += 30;
    matchReason = "Name contains query";
  }
  // Description match
  if (desc.includes(q)) {
    score += 15;
    matchReason = matchReason ? `${matchReason} + Description match` : "Description match";
  }
  // URL match
  if (url.includes(q)) {
    score += 10;
  }
  // GitHub Stars bonus
  if (resource.githubStars && resource.githubStars > 0) {
    score += Math.min(5, Math.log10(resource.githubStars) * 2);
  }
  // Rich description bonus
  if (desc.length > 50) {
    score += 5;
  }
  // Source bonus
  if (resource.source === "fmhy") {
    score += 3;
  }
  
  return { score, matchReason };
}
