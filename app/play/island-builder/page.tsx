"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Maximize2 } from "lucide-react";

export default function IslandBuilderPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Mykos Island Builder</h1>
              <p className="text-sm text-muted-foreground">Build your dream island</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.documentElement.requestFullscreen()}
          >
            <Maximize2 className="mr-2 h-4 w-4" />
            Fullscreen
          </Button>
        </div>
      </div>

      {/* Game Iframe */}
      <div className="h-[calc(100vh-73px)] w-full">
        <iframe
          src="/games/island-builder/play.html"
          className="h-full w-full border-0"
          allow="fullscreen"
          title="Mykos Island Builder"
        />
      </div>
    </div>
  );
}
