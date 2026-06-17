import { allPosts } from "contentlayer/generated";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Wrench,
  FileText,
  Eye,
  FileBadge,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Image,
  Code2,
  Lock,
  Shuffle,
  Hash,
  Globe,
  Timer,
  Sparkles,
  CalendarDays,
  Clock,
} from "lucide-react";
import { CATEGORIES, CATEGORY_LIST } from "@/lib/tools";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Craftisle Tools — Free Online Tools for Developers & Creators | Craftisle Blog",
  description:
    "Discover 135+ free online tools across the Craftisle ecosystem. Image editors, PDF converters, file viewers, resume builder, encryption, formatters, and more. No signup, 100% browser-based.",
  keywords: [
    "free online tools", "image editor online", "PDF tools free",
    "file viewer online", "resume builder free", "developer tools online",
    "encryption tools", "formatter tools", "converter tools",
    "craftisle tools", "online utility tools",
  ],
});

// Product definitions for subdomain tools
const ECOSYSTEM_PRODUCTS = [
  {
    id: "pdf-tools",
    name: "PDF Tools",
    tagline: "67 PDF tools, 100% client-side",
    description:
      "Merge, split, compress, convert, edit, OCR, sign, and secure PDFs — all processed in your browser with zero server uploads. Powered by pdf-lib + qpdf.wasm.",
    icon: FileText,
    url: "https://pdf.craftisle.com",
    color: "text-red-500",
    bg: "bg-red-500/10",
    stats: "67 tools • 14 languages • WebAssembly powered",
    features: ["Merge & Split", "Compress & OCR", "Convert to/from 20+ formats", "Encrypt & Sign", "Edit & Annotate"],
  },
  {
    id: "file-viewer",
    name: "File Viewer",
    tagline: "Preview 100+ file formats online",
    description:
      "Open and preview PDF, DOCX, XLSX, PPTX, images, 3D models, CAD files, and code — no software installation needed. Built on FlyFish viewer engine.",
    icon: Eye,
    url: "https://viewer.craftisle.com",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    stats: "100+ formats • 5 specialized viewers • 3D + CAD support",
    features: ["PDF Viewer", "DOCX/XLSX/PPTX Viewer", "3D Model Viewer (STL/OBJ/GLTF)", "CAD Viewer (DWG/DXF)", "Image & Code Viewer"],
  },
  {
    id: "resume-builder",
    name: "Resume Builder",
    tagline: "Build professional resumes, 100% private",
    description:
      "Create, edit, and export ATS-friendly resumes with rich text editing, multiple templates, and local-only storage. Export to PDF or DOCX. Based on Reactive Resume.",
    icon: FileBadge,
    url: "https://resume.craftisle.com",
    color: "text-green-500",
    bg: "bg-green-500/10",
    stats: "15+ section types • Multiple templates • PDF/DOCX export",
    features: ["Rich Text Editing", "Local Storage (Privacy First)", "PDF & DOCX Export", "Template Switching", "Keyboard Shortcuts"],
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  encryption: <Lock className="h-5 w-5" />,
  formatter: <Code2 className="h-5 w-5" />,
  converter: <Shuffle className="h-5 w-5" />,
  dev: <Wrench className="h-5 w-5" />,
  generator: <Sparkles className="h-5 w-5" />,
  text: <Hash className="h-5 w-5" />,
  network: <Globe className="h-5 w-5" />,
  image: <Image className="h-5 w-5" />,
  utility: <Timer className="h-5 w-5" />,
  other: <Wrench className="h-5 w-5" />,
};

export default function BlogPage() {
  const currentYear = new Date().getFullYear();

  // Structured Data: CollectionPage + ItemList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Craftisle Free Online Tools",
    description: "135+ free online tools across the Craftisle ecosystem. Image editors, PDF converters, file viewers, resume builder, encryption, formatters, and more.",
    url: "https://craftisle.com/blog",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: ECOSYSTEM_PRODUCTS.length,
      itemListElement: ECOSYSTEM_PRODUCTS.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: product.url,
        description: product.tagline,
      })),
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              Craftisle Ecosystem
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              135+ Free Online Tools
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Everything you need to work smarter — image editors, PDF processors, 
              file viewers, resume builder, encryption tools, code formatters, and more. 
              All 100% browser-based, no signup required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Browse All Tools <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/blog/how-to"
                className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                How-To Guides <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Products</Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              The Craftisle Tool Suite
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Four specialized products covering every workflow — all free, private, and browser-based.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ECOSYSTEM_PRODUCTS.map((product) => {
              const IconComponent = product.icon;
              return (
                <Card
                  key={product.id}
                  className="group relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <CardHeader>
                    <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${product.bg}`}>
                      <IconComponent className={`h-6 w-6 ${product.color}`} />
                    </div>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription className="text-sm font-medium text-primary">
                      {product.tagline}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                    <div className="space-y-2">
                      {product.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-sm">
                          <span className={`h-1.5 w-1.5 rounded-full ${product.color.replace('text-', 'bg-')}`} />
                          {feat}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {product.stats}
                    </div>
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Open {product.name} <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Site Tools by Category */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Tool Categories</Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Built-in Tools on Craftisle
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              62 tools across 10 categories — all running directly in your browser with instant results.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {CATEGORY_LIST.map((cat) => (
              <Link key={cat.key} href={`/tools?category=${cat.key}`}>
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5">
                  <CardHeader className="pb-3">
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {CATEGORY_ICONS[cat.key] || <Wrench className="h-5 w-5" />}
                    </div>
                    <CardTitle className="text-base">{cat.label}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How-To Guides & Resources */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Learn</Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Guides & Resources
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Step-by-step tutorials, tool comparisons, and best practices to get the most out of Craftisle.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Link href="/blog/how-to">
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                  </div>
                  <CardTitle className="text-lg">How-To Guides</CardTitle>
                  <CardDescription>
                    Detailed walkthroughs for every tool — from image compression to AES encryption.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/blog/tools">
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Wrench className="h-5 w-5 text-orange-500" />
                  </div>
                  <CardTitle className="text-lg">Tool Spotlights</CardTitle>
                  <CardDescription>
                    In-depth articles covering tool features, use cases, and pro tips.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/blog/review">
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <Eye className="h-5 w-5 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">Tool Reviews</CardTitle>
                  <CardDescription>
                    Honest comparisons and alternatives for popular developer and productivity tools.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Articles */}
      <section className="py-16 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Articles</Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Latest Articles
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              In-depth guides, tool tutorials, and ecosystem updates — all written by the Craftisle team.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allPosts
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((post) => {
                const wordCount = post.body.raw.split(/\s+/).length;
                const readingTime = Math.max(1, Math.ceil(wordCount / 200));
                return (
                  <Link key={post.slugAsParams} href={`/blog/${post.slugAsParams}`}>
                    <Card className="h-full group transition-all hover:border-primary/50 hover:shadow-md overflow-hidden">
                      {post.image && (
                        <div className="aspect-[16/9] overflow-hidden">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(post.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {readingTime} min read
                          </span>
                        </div>
                        <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {post.description}
                        </CardDescription>
                      </CardHeader>
                      {post.categories && post.categories.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1.5">
                            {post.categories.map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Ready to explore all {ECOSYSTEM_PRODUCTS.length} products and 135+ tools?
            </h2>
            <p className="mt-3 text-muted-foreground">
              No signup, no ads, no tracking. Just pure browser-based utility — free forever.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Start Exploring
              </Link>
              <a
                href="https://pdf.craftisle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                PDF Tools <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
