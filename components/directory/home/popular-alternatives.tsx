import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getHotResourcesByScore } from "@/lib/fmhy-data";
import { ArrowRight, Flame } from "lucide-react";

/**
 * Popular Free Alternatives
 * Show real free alternatives to popular paid tools
 */
export function PopularAlternatives() {
  // Get top-scored resources (these are high-quality free tools)
  const topResources = getHotResourcesByScore(6);

  if (!topResources || topResources.length === 0) return null;

  // Map resources to alternative pairs (free alternative → paid tool)
  const alternatives = [
    { free: "uBlock Origin", paid: "AdBlock Plus", category: "Adblock" },
    { free: "GIMP", paid: "Adobe Photoshop", category: "Image Editing" },
    { free: "LibreOffice", paid: "Microsoft Office", category: "Office" },
    { free: "Audacity", paid: "Adobe Audition", category: "Audio" },
    { free: "OBS Studio", paid: "Camtasia", category: "Screen Recording" },
    { free: "Jitsi", paid: "Zoom", category: "Communication" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
      {topResources.slice(0, 6).map((resource, i) => {
        const alt = alternatives[i] || { free: resource.name, paid: "Paid Tool", category: resource.categoryName || "Tools" };
        return (
          <Link key={resource.id} href={`/directory/resource/${resource.id}`} className="group">
            <div className="rounded-xl border bg-card p-3 md:p-5 transition-all hover:border-primary/40 hover:shadow-md h-full">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-orange-500" />
                <Badge variant="secondary" className="text-xs">{alt.category}</Badge>
              </div>
              <h3 className="font-semibold text-base mb-1">
                {alt.free}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Free alternative to <span className="font-medium text-foreground">{alt.paid}</span>
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {resource.description && resource.description !== "**"
                  ? resource.description.slice(0, 100)
                  : "High-quality free tool with strong features."}
              </p>
              <div className="mt-3 flex items-center text-xs text-primary">
                View Resource <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
