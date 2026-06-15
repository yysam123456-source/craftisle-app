import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ALTERNATIVES_MAP, toSlug, type AlternativeEntry } from "@/lib/alternatives";
import { ArrowRight, Flame, Sparkles } from "lucide-react";

/**
 * Popular Free Alternatives — fully data-driven from ALTERNATIVES_MAP
 * Each card shows a real paid tool → #1 free alternative pair
 */

const FEATURED_TOOLS: { key: string; icon: string; color: string }[] = [
  { key: "ChatGPT", icon: "🤖", color: "purple" },
  { key: "Adobe Photoshop", icon: "🎨", color: "blue" },
  { key: "Figma", icon: "✏️", color: "pink" },
  { key: "Notion", icon: "📝", color: "indigo" },
  { key: "Slack", icon: "💬", color: "green" },
  { key: "GitHub Copilot", icon: "💻", color: "orange" },
];

const BADGE_COLORS: Record<string, string> = {
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export function PopularAlternatives() {
  const cards = FEATURED_TOOLS
    .map(({ key, icon, color }) => {
      const entry = ALTERNATIVES_MAP[key];
      if (!entry || !entry.alternatives || entry.alternatives.length === 0) return null;
      const topAlt = entry.alternatives[0];
      return {
        key,
        slug: toSlug(key),
        entry,
        topAlt,
        icon,
        color,
        badgeClass: BADGE_COLORS[color] || "",
      };
    })
    .filter(Boolean);

  if (cards.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
      {cards.map((card) => (
        <Card key={card!.key} card={card!} />
      ))}
    </div>
  );
}

interface CardData {
  key: string;
  slug: string;
  entry: AlternativeEntry;
  topAlt: AlternativeEntry["alternatives"][0];
  icon: string;
  color: string;
  badgeClass: string;
}

function Card({ card }: { card: CardData }) {
  const { slug, entry, topAlt, icon, color, badgeClass } = card;

  return (
    <Link
      href={`/directory/alternatives/${slug}`}
      className="group block"
    >
      <div className="rounded-xl border bg-card p-3 md:p-5 transition-all hover:border-primary/40 hover:shadow-md h-full">
        {/* Header: Icon + Category Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{icon}</span>
          <Badge
            variant="secondary"
            className={`text-xs font-medium border-0 ${badgeClass}`}
          >
            {entry.category}
          </Badge>
          {topAlt.featured && (
            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
          )}
        </div>

        {/* Free Tool Name */}
        <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
          {topAlt.name}
        </h3>

        {/* "Free alternative to XXX" */}
        <p className="text-sm text-muted-foreground mb-2">
          Free alternative to{" "}
          <span className="font-medium text-foreground">{entry.paidTool}</span>
        </p>

        {/* Reason / Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {topAlt.reason}
        </p>

        {/* CTA */}
        <div className="mt-3 flex items-center text-xs text-primary font-medium">
          View Alternatives
          <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
