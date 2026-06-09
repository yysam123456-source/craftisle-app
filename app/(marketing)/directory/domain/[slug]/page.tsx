import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { getAllCategories } from "@/lib/fmhy-data";
import { getDomainGroups } from "@/lib/category-domains";
import { DOMAINS, getDomainForCategoryId, formatCategoryName } from "@/lib/unified-categories";
import { notFound } from "next/navigation";

interface DomainPageProps {
  params: Promise<{ slug: string }>;
}

const DATE_MODIFIED = "2026-06-09";

export async function generateStaticParams() {
  return DOMAINS.map((d) => ({ slug: d.id }));
}

export async function generateMetadata({
  params,
}: DomainPageProps): Promise<Metadata> {
  const { slug } = await params;
  const domain = DOMAINS.find((d) => d.id === slug);
  if (!domain) return constructMetadata({ title: "Domain Not Found" });

  const allCats = getAllCategories();
  const domainCats = allCats.filter((c) => getDomainForCategoryId(c.id) === slug);
  const totalResources = domainCats.reduce((sum, c) => sum + (c.count || 0), 0);

  return constructMetadata({
    title: `${domain.name} Resources | Free ${domain.name} Tools & Software | Craftisle`,
    description: `Browse ${domainCats.length} categories and ${totalResources} free ${domain.name.toLowerCase()} tools, APIs, and software. ${domain.description}`,
    image: `/og/domain-${slug}.png`,
    keywords: [
      `free ${domain.name.toLowerCase()} tools`,
      `best ${domain.name.toLowerCase()} resources`,
      `${domain.name.toLowerCase()} software`,
      "free developer resources",
      "open source tools",
    ],
  });
}

export default async function DomainPage({ params }: DomainPageProps) {
  const { slug } = await params;
  const domain = DOMAINS.find((d) => d.id === slug);
  if (!domain) notFound();

  const allCats = getAllCategories();
  const domainCats = allCats.filter(
    (c) => getDomainForCategoryId(c.id) === slug,
  );
  const totalResources = domainCats.reduce(
    (sum, c) => sum + (c.count || 0),
    0,
  );

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${domain.name} Resources`,
    description: domain.description,
    url: `https://craftisle.app/directory/domain/${slug}`,
    dateModified: DATE_MODIFIED,
    publisher: {
      "@type": "Organization",
      name: "Craftisle",
      url: "https://craftisle.app",
    },
    numberOfItems: totalResources,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://craftisle.app" },
        { "@type": "ListItem", position: 2, name: "Directory", item: "https://craftisle.app/directory" },
        { "@type": "ListItem", position: 3, name: domain.name, item: `https://craftisle.app/directory/domain/${slug}` },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="border-b bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/directory" className="hover:text-primary">Directory</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{domain.name}</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${DOMAINS.find(d => d.id === slug)?.color || "from-gray-500 to-slate-600"} flex items-center justify-center text-3xl shrink-0`}>
              {domain.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {domain.name}
              </h1>
              <p className="mt-2 text-muted-foreground">{domain.description}</p>
              <div className="flex gap-3 mt-2">
                <Badge variant="secondary">{domainCats.length} categories</Badge>
                <Badge variant="secondary">{totalResources.toLocaleString()} resources</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category List */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">
            All {domain.name} Categories
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domainCats.map((cat) => (
              <Link
                key={cat.id}
                href={`/directory/${cat.id}`}
                className="group rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{cat.icon || "📦"}</span>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {cat.name || formatCategoryName(cat.id)}
                  </h3>
                </div>
                {cat.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {cat.description}
                  </p>
                ) : null}
                <Badge variant="secondary" className="text-xs">
                  {cat.count?.toLocaleString() || 0} resources
                </Badge>
              </Link>
            ))}
          </div>

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link
              href="/directory"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← Back to all categories
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
