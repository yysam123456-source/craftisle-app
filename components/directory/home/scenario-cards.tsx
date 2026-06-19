import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  GlassCard,
  GlassCardContent
} from "@/components/ui/glass-card";
import {
  Bot, Palette, Code, Shield, BookOpen, Gamepad2,
  PenLine, DollarSign, Globe, BarChart3, Home, Wrench,
  Download, Image as ImageIcon, Film, Sparkles, Paintbrush,
  Library, Gamepad2 as GameIcon, ShieldCheck, Server
} from "lucide-react";

/**
 * Scenario-based entry points
 * User-centric view, not category view
 * "What do you want to do?" → Click a scenario → See curated recommendations
 */

const SCENARIO_ENTRIES = [
  // ── Row 1 ──────────────────────────────────────
  {
    icon: Bot, title: "Find AI Assistant",
    description: "ChatGPT, Claude, Gemini - which one fits you?",
    href: "/directory/compare/chatgpt/claude",
    cta: "View Comparison", gradientFrom: "#3b82f6", gradientTo: "#8b5cf6",
  },
  {
    icon: Palette, title: "Find Design Tools",
    description: "Figma alternatives, free design tools",
    href: "/directory/alternatives/figma",
    cta: "View Alternatives", gradientFrom: "#ec4899", gradientTo: "#a855f7",
  },
  {
    icon: Code, title: "Find Dev Tools",
    description: "APIs, databases, deployment tools",
    href: "/directory/best/development",
    cta: "View Rankings", gradientFrom: "#22c55e", gradientTo: "#10b981",
  },

  // ── Row 2 ──────────────────────────────────────
  {
    icon: Shield, title: "Find Privacy Tools",
    description: "Ad blocking, encrypted messaging, anonymous browsing",
    href: "/directory/best/adblock",
    cta: "View Recommendations", gradientFrom: "#ef4444", gradientTo: "#dc2626",
  },
  {
    icon: BookOpen, title: "Find Learning Resources",
    description: "Free courses, tutorials, documentation, e-books",
    href: "/directory/best/reading",
    cta: "View Resources", gradientFrom: "#eab308", gradientTo: "#f59e0b",
  },
  {
    icon: Gamepad2, title: "Find Entertainment Tools",
    description: "Games, media, streaming, entertainment",
    href: "/directory/Gaming",
    cta: "View Recommendations", gradientFrom: "#ec4899", gradientTo: "#f43f5e",
  },

  // ── Row 3 ──────────────────────────────────────
  {
    icon: PenLine, title: "Find Productivity Tools",
    description: "Notion alternatives, task managers, note-taking apps",
    href: "/directory/alternatives/notion",
    cta: "View Alternatives", gradientFrom: "#6366f1", gradientTo: "#8b5cf6",
  },
  {
    icon: DollarSign, title: "Find Free Alternatives",
    description: "Free alternatives to popular paid tools",
    href: "/directory/compare",
    cta: "View Free Tools", gradientFrom: "#10b981", gradientTo: "#059669",
  },
  {
    icon: Globe, title: "Find Open Source Tools",
    description: "Self-hosted, customizable, privacy-friendly",
    href: "/directory/best/linux",
    cta: "View Open Source", gradientFrom: "#f97316", gradientTo: "#ea580c",
  },

  // ── Task-oriented scenarios ───────────────────────
  {
    icon: Download, title: "Download Videos",
    description: "Download YouTube, TikTok, Twitch videos for offline viewing",
    href: "/directory/search?q=video+download+youtube+tiktok",
    cta: "Find Downloaders", gradientFrom: "#ef4444", gradientTo: "#f97316",
  },
  {
    icon: ImageIcon, title: "Remove Background",
    description: "Remove image backgrounds for product photos, avatars, designs",
    href: "/directory/search?q=background+removal+image+transparent",
    cta: "Find Tools", gradientFrom: "#a855f7", gradientTo: "#6366f1",
  },
  {
    icon: Wrench, title: "Convert Files",
    description: "Convert PDF, Word, video, audio files between formats",
    href: "/directory/search?q=file+converter+pdf+word+video",
    cta: "Find Converters", gradientFrom: "#3b82f6", gradientTo: "#06b6d4",
  },
  {
    icon: Film, title: "Edit Videos",
    description: "Trim, cut, add effects to videos for YouTube, TikTok, Reels",
    href: "/directory/search?q=video+editing+editor+trim+cut",
    cta: "Find Editors", gradientFrom: "#ec4899", gradientTo: "#f43f5e",
  },
  {
    icon: Bot, title: "Chat with AI Free",
    description: "Free AI chatbots for writing, coding, learning, brainstorming",
    href: "/directory/search?q=ai+chat+free+gpt+claude+gemini",
    cta: "Find AI Chats", gradientFrom: "#22c55e", gradientTo: "#10b981",
  },
  {
    icon: Paintbrush, title: "Design without Photoshop",
    description: "Free alternatives to Photoshop, Illustrator, Canva for graphic design",
    href: "/directory/search?q=design+free+photoshop+alternative+graphic",
    cta: "Find Design Tools", gradientFrom: "#f97316", gradientTo: "#ea580c",
  },
  {
    icon: Library, title: "Watch Anime & Manga",
    description: "Free streaming sites and apps for anime, manga, manhwa",
    href: "/directory/search?q=anime+manga+free+stream+read",
    cta: "Find Sites & Apps", gradientFrom: "#6366f1", gradientTo: "#8b5cf6",
  },
  {
    icon: GameIcon, title: "Free Games & Emulators",
    description: "Free PC games, Android games, emulators, ROMs",
    href: "/directory/search?q=game+free+emulator+rom+android",
    cta: "Find Games", gradientFrom: "#06b6d4", gradientTo: "#22d3ee",
  },
  {
    icon: ShieldCheck, title: "Block Ads Everywhere",
    description: "Ad blockers for browser, Android, iOS, smart TV, router",
    href: "/directory/search?q=adblock+blocker+ads+browser+android",
    cta: "Find Blockers", gradientFrom: "#10b981", gradientTo: "#059669",
  },
  {
    icon: Server, title: "Self-Host Services",
    description: "Host your own cloud, media server, VPN, password manager",
    href: "/directory/search?q=self-hosted+homelab+server+docker+cloud",
    cta: "Find Self-Hosted", gradientFrom: "#14b8a6", gradientTo: "#0d9488",
  },
];

export function ScenarioGlassCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
      {SCENARIO_ENTRIES.map((entry) => {
        const Icon = entry.icon;
        return (
          <Link key={entry.href} href={entry.href} className="group">
            <GlassCard
              className="h-full transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl hover:border-white/30 dark:hover:border-white/15"
              gradientFrom={entry.gradientFrom}
              gradientTo={entry.gradientTo}
            >
              <GlassCardContent className="p-4 md:p-5">
                <div className="flex items-start gap-3.5">
                  {/* 渐变图标圆球 */}
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ring-1 ring-black/[0.04] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${entry.gradientFrom}12, ${entry.gradientTo}12)`,
                    }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{
                        background: `linear-gradient(135deg, ${entry.gradientFrom}, ${entry.gradientTo})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1 text-foreground leading-tight">{entry.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{entry.description}</p>

                    {/* CTA — 渐变色文字 + 滑动箭头 */}
                    <span
                      className="inline-flex items-center gap-1 text-sm font-bold opacity-80 transition-all duration-300 group-hover:opacity-100 group-hover:gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${entry.gradientFrom}, ${entry.gradientTo})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {entry.cta}
                      <ArrowRight className="h-3.5 w-3.5" style={{ color: entry.gradientFrom }} />
                    </span>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
        );
      })}
    </div>
  );
}
