import Link from "next/link";
import { getAllCategories, getAllResources } from "@/lib/fmhy-data";
import {
  ArrowRight, LayoutGrid, Sparkles, TrendingUp,
  BotMessageSquare, ShieldQuestion, Smartphone, Download,
  BookOpen, Gamepad2, Terminal, HardDrive, Tv, Lock,
  Code2, Globe, Wrench, Film, Music, Image as ImageIcon,
  Palette, Cloud, Cpu, Database, MapPin, ShieldCheck,
  GraduationCap, ShoppingCart, Car, Plane, UtensilsCrossed,
  HeartPulse, Scale, Landmark, Microscope, Fingerprint,
  Server, Workflow, FileCode, Monitor, Briefcase, Coins,
  Users, MessageSquare, Mail,
  type LucideProps
} from "lucide-react";

/**
 * Top Categories — 简化版分类浏览
 * 只展示 Top 8-10 个分类（按资源数量排序）
 * 升级：玻璃拟态 + 渐变图标 + hover 动效
 */

// ── 分类图标映射（覆盖所有常见分类）───────────────────────
const CATEGORY_ICON_MAP: Record<string, React.FC<LucideProps>> = {
  // ─ AI & Tech ─
  'Artificial-Intelligence': BotMessageSquare,
  'AI-Horde': Cpu,
  'AI-Text': Code2,
  'AI-Image': ImageIcon,
  // ─ Privacy & Security ─
  'Adblock': ShieldQuestion,
  'Privacy': Lock,
  'VPN': Globe,
  'Security': Fingerprint,
  // ─ Development ─
  'Development': Code2,
  'APIs,-Data,-and-ML': Database,
  'DevOps': Server,
  'Programming': FileCode,
  'Tools-for-Teams-and-Collaboration': Workflow,
  // ─ Media ─
  'Video': Film,
  'Music': Music,
  'Streaming': Tv,
  'Images': ImageIcon,
  'Design': Palette,
  'Media': Tv,
  // ─ Downloads & Files ─
  'Downloading': Download,
  'Storage': HardDrive,
  'File-Sharing': Cloud,
  'Hosting': Cloud,
  // ─ Gaming ─
  'Gaming': Gamepad2,
  'Games-&-Comics': Gamepad2,
  // ─ Reading & Learning ─
  'Reading': BookOpen,
  'Education': GraduationCap,
  'Academic': GraduationCap,
  // ─ Systems & OS ─
  'Linux': Terminal,
  'Mobile': Smartphone,
  'Android': Smartphone,
  'iOS': Smartphone,
  'Windows': Monitor,
  // ─ Utilities ─
  'Misc': Wrench,
  'Utilities': Wrench,
  // ─ Lifestyle ─
  'Shopping': ShoppingCart,
  'Automotive': Car,
  'Travel': Plane,
  'Food': UtensilsCrossed,
  'Health': HeartPulse,
  'Legal': Scale,
  'Government': Landmark,
  'Science': Microscope,
  // ─ Business & Finance ─
  'Finance': TrendingUp,
  'Business': Briefcase,
  'Cryptocurrency': Coins,
  // ─ Internet & Web ─
  'Internet': Globe,
  'Social': Users,
  'Communication': MessageSquare,
  'Email': Mail,
  // ─ Geography & Infrastructure ─
  'Geocoding': MapPin,
  'Transportation': MapPin,
  'Major-Cloud-Providers': Cloud,
};

// ── 渐变色映射（每个分类独立配色）─────────────────────────────
const CATEGORY_GRADIENT_MAP: Record<string, { from: string; to: string }> = {
  'Artificial-Intelligence': { from: "#3b82f6", to: "#8b5cf6" },
  'AI-Horde':                { from: "#6366f1", to: "#a855f7" },
  'AI-Text':                 { from: "#a855f7", to: "#ec4899" },
  'AI-Image':                { from: "#06b6d4", to: "#3b82f6" },
  'Adblock':                 { from: "#ef4444", to: "#f97316" },
  'Privacy':                 { from: "#22c55e", to: "#10b981" },
  'VPN':                     { from: "#3b82f6", to: "#6366f1" },
  'Security':                { from: "#dc2626", to: "#ef4444" },
  'Development':             { from: "#3b82f6", to: "#06b6d4" },
  'APIs,-Data,-and-ML':      { from: "#8b5cf6", to: "#ec4899" },
  'DevOps':                  { from: "#f97316", to: "#ef4444" },
  'Programming':             { from: "#14b8a6", to: "#06b6d4" },
  'Tools-for-Teams-and-Collaboration': { from: "#6366f1", to: "#8b5cf6" },
  'Video':                   { from: "#ec4899", to: "#f43f5e" },
  'Music':                   { from: "#22c55e", to: "#84cc16" },
  'Streaming':               { from: "#ef4444", to: "#f97316" },
  'Images':                  { from: "#3b82f6", to: "#06b6d4" },
  'Design':                  { from: "#ec4899", to: "#a855f7" },
  'Media':                   { from: "#a855f7", to: "#ec4899" },
  'Downloading':             { from: "#f97316", to: "#eab308" },
  'Storage':                 { from: "#6366f1", to: "#3b82f6" },
  'File-Sharing':            { from: "#0ea5e9", to: "#38bdf8" },
  'Hosting':                 { from: "#64748b", to: "#94a3b8" },
  'Gaming':                  { from: "#ec4899", to: "#a855f7" },
  'Games-&-Comics':          { from: "#f43f5e", to: "#ec4899" },
  'Reading':                 { from: "#eab308", to: "#f59e0b" },
  'Education':               { from: "#2563eb", to: "#3b82f6" },
  'Academic':                { from: "#7c3aed", to: "#8b5cf6" },
  'Linux':                   { from: "#f97316", to: "#ef4444" },
  'Mobile':                  { from: "#22c55e", to: "#10b981" },
  'Android':                 { from: "#22c55e", to: "#84cc16" },
  'iOS':                     { from: "#6366f1", to: "#8b5cf6" },
  'Windows':                 { from: "#0ea5e9", to: "#38bdf8" },
  'Misc':                    { from: "#6b7280", to: "#9ca3af" },
  'Utilities':               { from: "#78716c", to: "#a8a29e" },
  'Shopping':                { from: "#f59e0b", to: "#f97316" },
  'Automotive':              { from: "#78716c", to: "#a8a29e" },
  'Travel':                  { from: "#0891b2", to: "#06b6d4" },
  'Food':                    { from: "#ea580c", to: "#dc2626" },
  'Health':                  { from: "#ef4444", to: "#f97316" },
  'Legal':                   { from: "#1e40af", to: "#3b82f6" },
  'Government':              { from: "#1e3a5f", to: "#334155" },
  'Science':                 { from: "#059669", to: "#10b981" },
  'Finance':                 { from: "#059669", to: "#34d399" },
  'Business':                { from: "#4f46e5", to: "#7c3aed" },
  'Cryptocurrency':          { from: "#f7931a", to: "#fbbf24" },
  'Internet':                { from: "#3b82f6", to: "#60a5fa" },
  'Social':                  { from: "#ec4899", to: "#f43f5e" },
  'Communication':           { from: "#06b6d4", to: "#22d3ee" },
  'Email':                   { from: "#ea580c", to: "#f97316" },
  'Geocoding':               { from: "#10b981", to: "#34d399" },
  'Transportation':          { from: "#78716c", to: "#a8a29e" },
  'Major-Cloud-Providers':   { from: "#f97316", to: "#fb923c" },
};

// ── 智能图标匹配：标准化 ID 后精确匹配，否则按关键词回退 ────
function normalizeForMatch(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getCategoryIcon(id: string, name: string): React.FC<LucideProps> {
  // 1. 精确匹配
  if (CATEGORY_ICON_MAP[id]) return CATEGORY_ICON_MAP[id];
  // 2. 标准化匹配
  const norm = normalizeForMatch(id);
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (normalizeForMatch(key) === norm) return icon;
  }
  // 3. 按名称关键词回退
  const lower = (id + ' ' + name).toLowerCase();
  if (/ai|ml|machine|learning|neural|gpt|chatbot|llm/.test(lower)) return BotMessageSquare;
  if (/api|data/.test(lower)) return Database;
  if (/dev|program|code|coding|script/.test(lower)) return Code2;
  if (/game|comic|minecraft|roblox/.test(lower)) return Gamepad2;
  if (/gov|government|law|legal|politic/.test(lower)) return Landmark;
  if (/cloud|host|server|infra/.test(lower)) return Cloud;
  if (/team|collab|communic|chat|message/.test(lower)) return Workflow;
  if (/geo|map|location|transport|travel/.test(lower)) return MapPin;
  if (/security|priv|vpn|block|shield/.test(lower)) return ShieldQuestion;
  if (/video|stream|movie|film/.test(lower)) return Film;
  if (/music|audio|sound/.test(lower)) return Music;
  if (/image|photo|picture|design/.test(lower)) return ImageIcon;
  if (/book|read|edu|academic|learn|school/.test(lower)) return BookOpen;
  if (/download|file|storage|disk/.test(lower)) return HardDrive;
  if (/mobile|phone|android|ios|app/.test(lower)) return Smartphone;
  if (/linux|unix|terminal|command|shell/.test(lower)) return Terminal;
  if (/shop|buy|pay|finance|money|crypto|coin/.test(lower)) return Coins;
  if (/health|medical|hospital|doctor/.test(lower)) return HeartPulse;
  if (/science|research|lab|microscope/.test(lower)) return Microscope;
  return Globe; // 最终兜底
}

function getCategoryGradient(id: string): { from: string; to: string } {
  if (CATEGORY_GRADIENT_MAP[id]) return CATEGORY_GRADIENT_MAP[id];
  const norm = normalizeForMatch(id);
  for (const [key, grad] of Object.entries(CATEGORY_GRADIENT_MAP)) {
    if (normalizeForMatch(key) === norm) return grad;
  }
  return { from: "#6b7280", to: "#9ca3af" };
}

export function TopCategories() {
  const categories = getAllCategories();
  const resources = getAllResources();

  // 按资源数量排序，取前 8 个
  const topCategories = categories
    .map(cat => ({
      ...cat,
      count: resources.filter(r => r.category === cat.id).length,
      icon: getCategoryIcon(cat.id, cat.name || cat.id),
      gradient: getCategoryGradient(cat.id),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (topCategories.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 border-t border-border/40">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute -right-20 bottom-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[80px]" />
        {/* 浮动粒子 */}
        <div className="absolute top-1/3 left-1/4 h-2 w-2 rounded-full bg-blue-400/25 blur-sm animate-float-delayed" />
        <div className="absolute top-1/2 right-1/3 h-2.5 w-2.5 rounded-full bg-purple-400/20 blur-sm animate-float animation-delay-3000" />
        <div className="absolute bottom-1/3 left-1/3 h-2 w-2 rounded-full bg-cyan-400/20 blur-sm animate-float-delayed animation-delay-1500" />
      </div>

      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-5 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-sm">
            <LayoutGrid className="h-4 w-4" />
            Browse by Category
            <Sparkles className="h-3.5 w-3.5 opacity-60" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Explore by{" "}
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
              Category
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Explore 200+ categories of free and open-source tools
          </p>
        </div>

        {/* Category Grid — 2 rows x 4 cols */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {topCategories.map((cat) => {
            const href = cat.slug
              ? `/directory/best/${cat.slug}`
              : `/directory/best/${cat.id.toLowerCase()}`;
            const Icon = cat.icon;
            const gradient = cat.gradient;

            return (
              <Link
                key={cat.id}
                href={href}
                className="group block"
              >
                {/* 玻璃拟态卡片容器 */}
                <div className="relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-black/10 dark:group-hover:shadow-black/30 group-hover:border-white/30 dark:group-hover:border-white/15">
                  {/* Hover 光晕效果 */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(135deg, ${gradient.from}15, transparent 40%, transparent 60%, ${gradient.to}15)`,
                      filter: "blur(8px)",
                    }}
                  />

                  {/* 顶部渐变条 */}
                  <div
                    className="h-1 w-full transition-all duration-500 group-hover:h-1.5"
                    style={{
                      background: `linear-gradient(90deg, ${gradient.from}, ${gradient.to})`,
                    }}
                  />

                  <div className="relative p-5 sm:p-6">
                    {/* 图标 + 标题行 */}
                    <div className="mb-4 flex items-start gap-3.5">
                      {/* 图标容器 — 实色渐变圆形背景 + 白色图标 */}
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ring-1 ring-black/[0.04] transition-all duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-xl group-hover:ring-black/[0.08]"
                        style={{
                          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                        }}
                      >
                        <Icon
                          className="h-5 w-5 text-white transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold tracking-tight text-foreground transition-all duration-300 sm:text-lg">
                          <span className="group-hover:hidden">{cat.name}</span>
                          <span
                            className="hidden group-hover:inline-block bg-gradient-to-r bg-clip-text text-transparent"
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            {cat.name}
                          </span>
                        </h3>
                      </div>
                    </div>

                    {/* 描述/计数 */}
                    <p className="mb-4 leading-relaxed text-sm text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/80">
                      {cat.count} free tools available
                    </p>

                    {/* 底部：工具数量 + CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground/70 transition-colors group-hover:border-primary/10 group-hover:bg-primary/5 group-hover:text-foreground/70">
                        <LayoutGrid className="h-3 w-3" />
                        {cat.count} tools
                      </span>

                      {/* CTA — 渐变色滑入 */}
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-1.5"
                        style={{
                          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Explore
                        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: gradient.from }} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            href="/directory/categories"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <LayoutGrid className="h-4 w-4" />
            View All 200+ Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
