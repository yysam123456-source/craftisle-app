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
import {
  ArrowRight,
  Gamepad2,
  Wrench,
  BookOpen,
  QrCode,
  Image,
  FileText,
  Calculator,
  Play,
} from "lucide-react";

export default function IndexPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-32">
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              🎮 Free Game Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Discover Fun
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}Mini Games
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Play curated mini games, use handy tools, and explore more. No download required, play instantly.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/games">
                <Button size="lg">
                  <Gamepad2 className="mr-2 h-5 w-5" />
                  Start Playing
                </Button>
              </Link>
              <Link href="/tools">
                <Button size="lg" variant="outline">
                  <Wrench className="mr-2 h-5 w-5" />
                  Tools
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Popular Games</h2>
              <p className="mt-2 text-muted-foreground">Curated mini games, play instantly</p>
            </div>
            <Link href="/games">
              <Button variant="ghost">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="aspect-video bg-gradient-to-br from-green-400 to-blue-500 relative flex items-center justify-center">
                <Gamepad2 className="h-16 w-16 text-white/80" />
                <Badge className="absolute top-3 right-3">Hot</Badge>
              </div>
              <CardHeader>
                <CardTitle>Mykos Island Builder</CardTitle>
                <CardDescription>Build your dream island, explore endless possibilities</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/play/island-builder">
                  <Button className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Play Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="aspect-video bg-gradient-to-br from-amber-400 to-orange-500 relative flex items-center justify-center">
                <Gamepad2 className="h-16 w-16 text-white/80" />
                <Badge className="absolute top-3 right-3" variant="secondary">New</Badge>
              </div>
              <CardHeader>
                <CardTitle>Tiny World Builder</CardTitle>
                <CardDescription>Build your mini world, unleash creativity</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/play/tiny-world-builder">
                  <Button className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Play Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="aspect-video bg-gradient-to-br from-gray-300 to-gray-400 relative flex items-center justify-center">
                <Gamepad2 className="h-16 w-16 text-white/60" />
                <Badge className="absolute top-3 right-3" variant="secondary">Coming Soon</Badge>
              </div>
              <CardHeader>
                <CardTitle>More Games Coming</CardTitle>
                <CardDescription>Stay tuned for updates</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="secondary" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tools Preview */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Tools</h2>
              <p className="mt-2 text-muted-foreground">50+ free online tools</p>
            </div>
            <Link href="/tools">
              <Button variant="ghost">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <QrCode className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2 text-lg">QR Code Generator</CardTitle>
                <CardDescription>Custom styled QR codes</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools/qrcode">
                  <Button variant="ghost" size="sm" className="w-full">
                    Open Tool
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2 text-lg">JSON Formatter</CardTitle>
                <CardDescription>JSON beautify and minify</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools/json-formatter">
                  <Button variant="ghost" size="sm" className="w-full">
                    Open Tool
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Image className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2 text-lg">Image to Base64</CardTitle>
                <CardDescription>Convert images to/from Base64</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools/image-base64">
                  <Button variant="ghost" size="sm" className="w-full">
                    Open Tool
                  </Button>
                </Link>
              </CardContent>
            </Card>
              <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Calculator className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2 text-lg">Base64 Encode/Decode</CardTitle>
                <CardDescription>Base64 string encoding and decoding</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools/base64">
                  <Button variant="ghost" size="sm" className="w-full">
                    Open Tool
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <QrCode className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2 text-lg">Regex Tester</CardTitle>
                <CardDescription>Test regular expressions online</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools/regex">
                  <Button variant="ghost" size="sm" className="w-full">
                    Open Tool
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2 text-lg">Timestamp Converter</CardTitle>
                <CardDescription>Convert between timestamps and dates</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools/timestamp">
                  <Button variant="ghost" size="sm" className="w-full">
                    Open Tool
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Image className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2 text-lg">Markdown Preview</CardTitle>
                <CardDescription>Real-time Markdown preview</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools/markdown">
                  <Button variant="ghost" size="sm" className="w-full">
                    Open Tool
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <Calculator className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2 text-lg">More Tools</CardTitle>
                <CardDescription>50+ tools to explore</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Resource Directory */}
      <section className="border-t py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Directory</h2>
              <p className="mt-2 text-muted-foreground">Curated games, tools, and assets</p>
            </div>
            <Link href="/directory">
              <Button variant="ghost">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="text-4xl mb-2">🎮</div>
                <CardTitle className="text-lg">Game Directory</CardTitle>
                <CardDescription>Curated game recommendations and reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/directory/games">
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="text-4xl mb-2">🔧</div>
                <CardTitle className="text-lg">Tool Directory</CardTitle>
                <CardDescription>Tool categories and comparisons</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/directory/tools">
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="text-4xl mb-2">🎨</div>
                <CardTitle className="text-lg">Asset Directory</CardTitle>
                <CardDescription>Free assets, sounds, and image libraries</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/directory/assets">
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Latest Posts</h2>
              <p className="mt-2 text-muted-foreground">Game guides, dev logs, industry news</p>
            </div>
            <Link href="/blog">
              <Button variant="ghost">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>2026-05-20</span>
                </div>
                <CardTitle className="text-lg">Mykos Island Builder Dev Log</CardTitle>
                <CardDescription>Behind the scenes of game development and tech stack</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full">
                  Read More
                </Button>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>2026-05-15</span>
                </div>
                <CardTitle className="text-lg">Future of Mini Game Platforms</CardTitle>
                <CardDescription>Analysis of market trends and opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full">
                  Read More
                </Button>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>2026-05-10</span>
                </div>
                <CardTitle className="text-lg">How to Boost Productivity with Our Tools</CardTitle>
                <CardDescription>Practical tool usage guides and tips</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full">
                  Read More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to Start?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Sign up free to unlock more features and personalized experience
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg">
                  Sign Up Free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
