import { getRichInfoResourceIds, getAllResources } from "./lib/fmhy-data";

const ids = getRichInfoResourceIds();
console.log("📊 有详情页的资源总数:", ids.size);
console.log();

// 分类统计
const all = getAllResources();
const richResources = all.filter(r => ids.has(r.id));
const withDesc = richResources.filter(r => r.description && r.description.length > 20);
const withStars = richResources.filter(r => r.githubStars && r.githubStars > 0);
const withTags = richResources.filter(r => r.tags && r.tags.length > 0);

console.log("其中:");
console.log("  - 有 description (>20 chars):", withDesc.length);
console.log("  - 有 GitHub Stars:", withStars.length);
console.log("  - 有 tags:", withTags.length);
console.log();

// 检查"垃圾页面"（description 很短或为空）
const poorResources = richResources.filter(r => {
  const descLen = (r.description || "").length;
  const hasStars = r.githubStars && r.githubStars > 0;
  const hasTags = r.tags && r.tags.length > 0;
  // 垃圾页面定义：description < 50 chars，且没有 stars，且没有 tags
  return descLen < 50 && !hasStars && !hasTags;
});

console.log("❌ 可能的垃圾页面 (desc < 50 chars, 无 stars, 无 tags):", poorResources.length);
if (poorResources.length > 0) {
  console.log("\n示例 (前10个):");
  poorResources.slice(0, 10).forEach(r => {
    console.log(`  - ${r.name} (desc: ${(r.description || "").length} chars, stars: ${r.githubStars || 0}, tags: ${(r.tags || []).length})`);
  });
}
