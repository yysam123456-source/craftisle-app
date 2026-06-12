import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * 场景化入口（用户视角，不是分类视角）
 * "你想干什么" → 点一个场景 → 看到精选推荐 + 快速决策信息
 */

const SCENARIO_ENTRIES = [
  {
    icon: "🤖",
    title: "找 AI 助手",
    description: "ChatGPT、Claude、Gemini 哪个适合你？",
    href: "/directory/compare/chatgpt/claude",
    cta: "查看对比",
    color: "blue",
  },
  {
    icon: "🎨",
    title: "找设计工具",
    description: "Figma 替代品、免费设计工具",
    href: "/directory/alternatives/figma",
    cta: "查看替代品",
    color: "purple",
  },
  {
    icon: "💻",
    title: "找开发工具",
    description: "API、数据库、部署工具",
    href: "/directory/best/development",
    cta: "查看排行榜",
    color: "green",
  },
  {
    icon: "🔒",
    title: "找隐私工具",
    description: "广告拦截、加密通讯、匿名浏览",
    href: "/directory/Privacy-Security",
    cta: "查看推荐",
    color: "red",
  },
  {
    icon: "📚",
    title: "找学习资源",
    description: "免费课程、教程、文档",
    href: "/directory/Learning-Education",
    cta: "查看资源",
    color: "yellow",
  },
  {
    icon: "🎮",
    title: "找娱乐工具",
    description: "游戏、媒体、生产力工具",
    href: "/directory/Gaming",
    cta: "查看推荐",
    color: "pink",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 border-blue-200",
  purple: "bg-purple-500/10 text-purple-600 border-purple-200",
  green: "bg-green-500/10 text-green-600 border-green-200",
  red: "bg-red-500/10 text-red-600 border-red-200",
  yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  pink: "bg-pink-500/10 text-pink-600 border-pink-200",
};

export function ScenarioCards() {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            你想干什么？
          </h2>
          <p className="mt-1 text-muted-foreground">
            不是分类，是场景 — 点一个，快速找到你想要的工具
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {SCENARIO_ENTRIES.map((entry) => (
            <Link key={entry.href} href={entry.href} className="group">
              <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 text-2xl ${colorMap[entry.color]?.split(" ").slice(0, 2).join(" ")}`}>
                      {entry.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">
                        {entry.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {entry.description}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
                        {entry.cta}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
