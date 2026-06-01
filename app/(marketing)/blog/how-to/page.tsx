import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toolMeta, CATEGORIES } from "@/lib/tools";

interface ToolEntry {
  id: string;
  title: string;
  desc: string;
  icon: string;
  category: string;
}

export const metadata = {
  title: "How-to Guides — Free Online Tool Tutorials | Craftisle",
  description: "Step-by-step guides for using free online tools. Learn how to format JSON, generate QR codes, hash passwords, and more — no signup required.",
  keywords: [
    "how to use online tools",
    "free tool tutorials",
    "JSON formatter guide",
    "QR code generator tutorial",
    "online tool how-to",
    "Craftisle blog",
  ],
};

export default function HowToIndexPage() {
  // Group tools by category
  const toolsByCategory: Record<string, ToolEntry[]> = {};

  for (const [id, meta] of Object.entries(toolMeta)) {
    const cat = meta.category;
    if (!toolsByCategory[cat]) toolsByCategory[cat] = [];
    toolsByCategory[cat].push({
      id,
      title: meta.title,
      desc: meta.desc,
      icon: meta.icon,
      category: cat,
    });
  }

  const categoryOrder = Object.keys(CATEGORIES);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="space-y-4 mb-10">
        <Badge variant="secondary">Blog</Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          How-to Guides: Free Online Tools
        </h1>
        <p className="text-lg text-muted-foreground">
          Step-by-step tutorials for 60+ free online tools. Learn how to use each tool
          with screenshots, use cases, and FAQ.
        </p>
      </header>

      {categoryOrder.map((catKey) => {
        const catLabel = CATEGORIES[catKey as keyof typeof CATEGORIES];
        const tools = toolsByCategory[catLabel];
        if (!tools || tools.length === 0) return null;

        return (
          <section key={catKey} className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{catLabel}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/blog/how-to/${tool.id}`}
                  className="block rounded-xl border bg-card p-4 hover:shadow-md transition"
                >
                  <div className="text-2xl mb-2">{tool.icon}</div>
                  <h3 className="font-semibold text-sm">
                    How to Use {tool.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {tool.desc}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
