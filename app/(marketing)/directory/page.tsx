import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Gamepad2, Wrench, Image, BookOpen, ArrowRight } from "lucide-react";

const directories = [
  {
    title: "Games Directory",
    desc: "Curated mini games, reviews & guides",
    icon: <Gamepad2 className="h-8 w-8" />,
    href: "/directory/games",
    count: "12 Games",
    badge: "Hot",
    color: "from-green-400 to-blue-500",
  },
  {
    title: "Tools Directory",
    desc: "Practical tools, comparisons & tutorials",
    icon: <Wrench className="h-8 w-8" />,
    href: "/directory/tools",
    count: "8 Tools",
    badge: null,
    color: "from-blue-400 to-purple-500",
  },
  {
    title: "Assets Directory",
    desc: "Free images, sounds, icons & fonts",
    icon: <Image className="h-8 w-8" />,
    href: "/directory/assets",
    count: "20+ Resources",
    badge: "New",
    color: "from-pink-400 to-red-500",
  },
  {
    title: "Articles Directory",
    desc: "Game guides, dev logs & industry news",
    icon: <BookOpen className="h-8 w-8" />,
    href: "/directory/articles",
    count: "15+ Articles",
    badge: null,
    color: "from-yellow-400 to-orange-500",
  },
];

export default function DirectoryPage() {
  return (
    <>
      {/* Page Header */}
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              📂 Resources
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Resource Directory
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Curated games, tools & assets to help you find what you need.
            </p>
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2">
            {directories.map((dir) => (
              <Card
                key={dir.href}
                className="overflow-hidden transition-shadow hover:shadow-lg"
              >
                <div className={`aspect-[3/1] bg-gradient-to-r ${dir.color} relative flex items-center justify-center p-8`}>
                  <div className="text-white">
                    <div className="mb-2">{dir.icon}</div>
                    <div className="text-sm opacity-80">{dir.count}</div>
                  </div>
                  {dir.badge && (
                    <Badge className="absolute top-4 right-4" variant="secondary">
                      {dir.badge}
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle>{dir.title}</CardTitle>
                  <CardDescription>{dir.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={dir.href}>
                    <Button className="w-full" variant="outline">
                      Browse <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Submit CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold">Want your resource featured?</h2>
            <p className="mt-4 text-muted-foreground">
              Developers & tool creators can submit their work for review and inclusion.
            </p>
            <Link href="/submit">
              <Button size="lg" className="mt-8">
                Submit Resource <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
