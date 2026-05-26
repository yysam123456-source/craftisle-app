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
import { Gamepad2, Play, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Games | Craftisle",
  description: "Free online mini games, play instantly in your browser.",
};

const games = [
  {
    id: "island-builder",
    title: "Mykos Island Builder",
    desc: "Build your dream island, explore endless possibilities",
    badge: "Hot",
    badgeVariant: "default" as const,
    gradient: "from-green-400 to-blue-500",
  },
  {
    id: "tiny-world-builder",
    title: "Tiny World Builder",
    desc: "Build your mini world, unleash creativity",
    badge: "New",
    badgeVariant: "secondary" as const,
    gradient: "from-amber-400 to-orange-500",
  },
];

export default function GamesPage() {
  return (
    <div>
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              🎮 Games
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Free Online Games
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Play instantly in your browser. No download required.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Card key={game.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <div className={`aspect-video bg-gradient-to-br ${game.gradient} relative flex items-center justify-center`}>
                  <Gamepad2 className="h-16 w-16 text-white/80" />
                  <Badge className="absolute top-3 right-3" variant={game.badgeVariant}>
                    {game.badge}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle>{game.title}</CardTitle>
                  <CardDescription>{game.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/play/${game.id}`}>
                    <Button className="w-full">
                      <Play className="mr-2 h-4 w-4" />
                      Play Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}

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
    </div>
  );
}
