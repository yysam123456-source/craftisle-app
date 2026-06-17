import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Cache: precompute all resource IDs at build time
let allResourceIds: string[] = [];
let allResources: Record<string, any> = {};

function loadData() {
  if (allResourceIds.length > 0) return;
  
  const basePath = path.join(process.cwd(), "public", "data");
  const fmhyData = JSON.parse(
    fs.readFileSync(path.join(basePath, "fmhy-resources.json"), "utf-8")
  );
  
  const categories = fmhyData.categories || {};
  allResourceIds = [];
  allResources = {};
  
  for (const [catName, catData] of Object.entries(categories) as any) {
    for (const res of (catData as any).resources || []) {
      if (res.id) {
        allResourceIds.push(res.id);
        allResources[res.id] = { ...res, categoryName: catName };
      }
    }
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const countParam = url.searchParams.get("count") || "6";
  const count = Math.min(parseInt(countParam), 20);
  
  loadData();
  
  if (allResourceIds.length === 0) {
    return NextResponse.json({ resources: [] });
  }
  
  // Randomly pick `count` IDs
  const shuffled = [...allResourceIds].sort(() => Math.random() - 0.5);
  const selectedIds = shuffled.slice(0, count);
    
  const resources = selectedIds
    .map((id) => allResources[id])
    .filter(Boolean)
    .map((res) => ({
      id: res.id,
      name: res.name || "Unnamed Resource",
      description: res.description || "",
      url: res.url || "",
      categoryName: res.categoryName || "",
    }));
    
  return NextResponse.json({ resources });
}
