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
  ShieldCheck,
  Gift,
  Zap,
  QrCode,
  FileText,
  Image,
  Calculator,
  Play,
} from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";

export default function IndexPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-32">
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              🎮 Free Game Platform & Tools
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Discover Fun
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}Mini Games
              </span>
              {" "}&& Useful Tools
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Play curated mini games, use 50+ free online tools. No download required, no registration, play instantly.
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
                  Free Tools
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three Selling Points */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Point 1 */}
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>100% Free</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    No registration, no limits, no hidden costs. All tools are completely free to use.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Point 2 */}
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Gift className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>No Installation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    All tools run in your browser. No download, no installation, use instantly.
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Point 3 */}
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>50+ Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    PDF tools, image tools, developer tools, converters, generators, and more.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Ad: below selling points */}
      <section className="flex justify-center py-6">
        <AdSlot slotId="homepage-below-points" size="leaderboard" label="Homepage Below Points" />
      </section>

      {/* Popular Tools */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Popular Tools</h2>
              <p className="mt-2 text-muted-foreground">Most used tools by our users</p>
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
                <CardTitle className="mt-2 text-lg">Image Compress</CardTitle>
                <CardDescription>Compress images with quality control</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools/image-compress">
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
                <FileText className="h-8 w-8 text-primary" />
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
          </div>
        </div>
      </section>

      {/* Ad: between tools and games */}
      <section className="flex justify-center py-6">
        <AdSlot slotId="homepage-tools-to-games" size="leaderboard" label="Homepage Between Tools & Games" />
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

      {/* Tool Categories */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Tool Categories</h2>
            <p className="mt-2 text-muted-foreground">Explore tools by category</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="text-4xl mb-2">🔐</div>
                <CardTitle className="text-lg">Encryption & Hashing</CardTitle>
                <CardDescription> AES, DES, Bcrypt, Hash, JWT</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools?category=encryption">
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="text-4xl mb-2">📝</div>
                <CardTitle className="text-lg">Formatters</CardTitle>
                <CardDescription>JSON, HTML, SQL, YAML</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools?category=formatter">
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="text-4xl mb-2">🔄</div>
                <CardTitle className="text-lg">Converters</CardTitle>
                <CardDescription>Base64, CSV/JSON, IP, Radix</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools?category=converter">
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="text-4xl mb-2">💻</div>
                <CardTitle className="text-lg">Developer Tools</CardTitle>
                <CardDescription>Regex, Mermaid, Cron, SVG</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools?category=dev">
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="text-4xl mb-2">🖼️</div>
                <CardTitle className="text-lg">Image Tools</CardTitle>
                <CardDescription>Resize, Compress, Convert, Crop</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools?category=image">
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="text-4xl mb-2">🎲</div>
                <CardTitle className="text-lg">Generators</CardTitle>
                <CardDescription>QR Code, UUID, Lorem Ipsum</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tools?category=generator">
                  <Button variant="ghost" size="sm" className="w-full">
                    Browse
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
