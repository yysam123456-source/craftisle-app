import Link from "next/link";
import { Star, GitFork, ExternalLink } from "lucide-react";
import { getAllResources, getAllCategories } from "@/lib/fmhy-data";

/**
 * Social Proof — 社会证明板块
 * 展示关键数字，建立用户信任
 * 对标：Product Hunt, G2, Capterra
 */

export function SocialProof() {
  // 从 FMHY 数据获取真实统计
  let totalTools = 16000;
  let totalCategories = 200;
  
  try {
    const resources = getAllResources();
    const categories = getAllCategories();
    totalTools = resources.length;
    totalCategories = categories.length;
  } catch (e) {
    // 使用默认值
  }
  
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        {/* Stats Grid */}
        <div className="grid gap-8 md:grid-cols-3 mb-10">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {totalTools.toLocaleString()}+
            </div>
            <div className="text-muted-foreground">
              Free & Open-Source Tools
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {totalCategories.toLocaleString()}+
            </div>
            <div className="text-muted-foreground">
              Categories
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              5
            </div>
            <div className="text-muted-foreground">
              Data Sources
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>🔄</span>
            <span>Updated daily</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>100% Free — No signup required</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span>🌟</span>
            <span>Open-source project</span>
          </div>
        </div>

        {/* GitHub Star CTA */}
        <div className="text-center mt-8">
          <Link
            href="https://github.com/yysam123456-source/craftisle-app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border bg-card hover:border-primary/40 hover:shadow-md transition-all"
          >
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">Star on GitHub</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </section>
  );
}
