import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Scenario-based entry points
 * User-centric view, not category view
 * "What do you want to do?" → Click a scenario → See curated recommendations
 */

const SCENARIO_ENTRIES = [
  {
    icon: "🤖",
    title: "Find AI Assistant",
    description: "ChatGPT, Claude, Gemini - which one fits you?",
    href: "/directory/compare/chatgpt/claude",
    cta: "View Comparison",
    color: "blue",
  },
  {
    icon: "🎨",
    title: "Find Design Tools",
    description: "Figma alternatives, free design tools",
    href: "/directory/alternatives/figma",
    cta: "View Alternatives",
    color: "purple",
  },
  {
    icon: "💻",
    title: "Find Dev Tools",
    description: "APIs, databases, deployment tools",
    href: "/directory/best/development",
    cta: "View Rankings",
    color: "green",
  },
  {
    icon: "🔒",
    title: "Find Privacy Tools",
    description: "Ad blocking, encrypted messaging, anonymous browsing",
    href: "/directory/Privacy-Security",
    cta: "View Recommendations",
    color: "red",
  },
  {
    icon: "📚",
    title: "Find Learning Resources",
    description: "Free courses, tutorials, documentation",
    href: "/directory/Learning-Education",
    cta: "View Resources",
    color: "yellow",
  },
  {
    icon: "🎮",
    title: "Find Entertainment Tools",
    description: "Games, media, productivity tools",
    href: "/directory/Gaming",
    cta: "View Recommendations",
    color: "pink",
  },
  {
    icon: "📝",
    title: "Find Productivity Tools",
    description: "Notion alternatives, task managers, note-taking apps",
    href: "/directory/alternatives/notion",
    cta: "View Alternatives",
    color: "indigo",
  },
  {
    icon: "💰",
    title: "Find Free Alternatives",
    description: "Free alternatives to popular paid tools",
    href: "/directory/best/free-tools",
    cta: "View Free Tools",
    color: "emerald",
  },
  {
    icon: "🌐",
    title: "Find Open Source Tools",
    description: "Self-hosted, customizable, privacy-friendly",
    href: "/directory/best/open-source",
    cta: "View Open Source",
    color: "orange",
  },
  {
    icon: "📊",
    title: "Find Marketing Tools",
    description: "SEO, social media, email marketing, analytics",
    href: "/directory/best/marketing",
    cta: "View Marketing Tools",
    color: "cyan",
  },
  {
    icon: "🏠",
    title: "Find Remote Work Tools",
    description: "Video calls, collaboration, project management",
    href: "/directory/best/productivity",
    cta: "View Remote Tools",
    color: "teal",
  },
  {
    icon: "🔧",
    title: "Find Browser Extensions",
    description: "Productivity, privacy, developer tools for your browser",
    href: "/directory/best/browser-extensions",
    cta: "View Extensions",
    color: "slate",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 border-blue-200",
  purple: "bg-purple-500/10 text-purple-600 border-purple-200",
  green: "bg-green-500/10 text-green-600 border-green-200",
  red: "bg-red-500/10 text-red-600 border-red-200",
  yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  pink: "bg-pink-500/10 text-pink-600 border-pink-200",
  indigo: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  orange: "bg-orange-500/10 text-orange-600 border-orange-200",
  cyan: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  teal: "bg-teal-500/10 text-teal-600 border-teal-200",
  slate: "bg-slate-500/10 text-slate-600 border-slate-200",
};

export function ScenarioCards() {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            What do you want to do?
          </h2>
          <p className="mt-1 text-muted-foreground">
            Not categories, but scenarios — click one to quickly find the tool you need
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
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
