"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
} from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Search, X, Star, ArrowRight,
  FileText, Image, ImageIcon, Palette, Cpu, Shield, Code, Type, Layers,
  // Image tools - unique icons
  Minus, ArrowRightLeft, RotateCw, Palette as ColorPalette, ScanLine,
  Fingerprint, FileImage, Info, Frame, Droplets, Sun, Scissors, Sparkles,
  User, Camera, ImagePlus, Grid3X3, Wand2, Eye, Contrast, Crop, ZoomIn,
  Download, LockOpen, Hash, FileSearch, PenTool, Stamp, CircleDot,
  Copy, AlertTriangle, PlusCircle, Volume2, TrendingUp,
  // Encryption
  KeyRound,
  // Formatters
  Braces, FileJson, GitCompare, ListOrdered, Quote, CodeXml,
  // Converters
  ArrowLeftRight, Binary, FileCode, Globe,
  // Generators
  QrCode, TextCursorInput, Shuffle, Box, AtSign,
  // Text
  AlignLeft, CaseUpper, FlipHorizontal, BarChart3,
  Quote as QuoteIcon, Link2Off, MinusCircle, RefreshCw, Split, WrapText, Repeat,
  // Network
  Calculator, Wifi, Radio, Monitor,
  // Utilities
  Timer, Clock, AlarmClock, TimerOff, Gamepad2, Keyboard, MousePointer,
  Dice1, Trophy,
  // Time
  CalendarDays, Clock4, Hourglass, CalendarRange,
  // Other
  FileDiff, CheckSquare, ArrowDownUp, ArrowUpCircle, ArrowDownCircle,
  ArrowRightCircle, ArrowLeftCircle, ListChecks, SortAsc, Filter,
  FileSpreadsheet, Table, FileOutput, Play, Pencil, Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toolMeta, CATEGORY_LIST } from "@/lib/tools";
import { imageToolIds } from "@/lib/image-tools/ids";
import type { ToolMeta } from "@/lib/tools";
import { useFavorites } from "@/hooks/use-favorites";
import { StarButton } from "@/components/star-button";

export function ToolsClient({ toolDirs }: { toolDirs: string[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { favorites, toggle, isFavorited } = useFavorites();

  // ── 每个工具独立的图标 + 渐变色映射 ──
  const TOOL_STYLE_MAP: Record<string, { from: string; to: string; icon: React.FC<any> }> = {
    // === Encryption & Hashing ===
    "aes-des":       { from: "#ef4444", to: "#f97316", icon: Shield },
    "bcrypt":        { from: "#ef4444", to: "#dc2626", icon: KeyRound },
    "hash":          { from: "#8b5cf6", to: "#a855f7", icon: Hash },
    "jwt":           { from: "#f97316", to: "#ef4444", icon: LockOpen },

    // === Formatters ===
    "json-formatter":  { from: "#f59e0b", to: "#eab308", icon: FileJson },
    "json-minify":     { from: "#f59e0b", to: "#d97706", icon: Braces },
    "json-comparison": { from: "#f59e0b", to: "#eab308", icon: GitCompare },
    "json-sort":       { from: "#d97706", to: "#b45309", icon: SortAsc },
    "json-escape":     { from: "#d97706", to: "#b45309", icon: Quote },
    "json-stringify":  { from: "#f59e0b", to: "#eab308", icon: Braces },
    "html-formatter":  { from: "#f97316", to: "#ea580c", icon: CodeXml },
    "sql-formatter":   { from: "#3b82f6", to: "#2563eb", icon: Code },
    "yaml-formatter":  { from: "#ea580c", to: "#dc2626", icon: FileText },
    "html-escape":     { from: "#f97316", to: "#ea580c", icon: CodeXml },

    // === Converters / Encoders ===
    "base64":         { from: "#22c55e", to: "#10b981", icon: ArrowLeftRight },
    "base32":         { from: "#22c55e", to: "#16a34a", icon: Binary },
    "base58":         { from: "#22c55e", to: "#15803d", icon: Hash },
    "radix-converter":{ from: "#22c55e", to: "#10b981", icon: Binary },
    "csv-json":       { from: "#22c55e", to: "#10b981", icon: FileSpreadsheet },
    "url-encode":     { from: "#22c55e", to: "#10b981", icon: Globe },
    "image-base64":   { from: "#3b82f6", to: "#8b5cf6", icon: ImageIcon },
    "png-to-svg":     { from: "#3b82f6", to: "#06b6d4", icon: PenTool },
    "ip-radix":       { from: "#3b82f6", to: "#06b6d4", icon: Wifi },
    "byte-converter": { from: "#22c55e", to: "#10b981", icon: ArrowLeftRight },

    // === Generators ===
    "sum":              { from: "#ec4899", to: "#a855f7", icon: Calculator },
    "cron":             { from: "#ec4899", to: "#db2777", icon: Timer },
    "regex":            { from: "#ec4899", to: "#a855f7", icon: Code },
    "regex-vis":        { from: "#ec4899", to: "#c026d3", icon: Eye },
    "mermaid":          { from: "#ec4899", to: "#a855f7", icon: GitCompare },
    "svg-editor":       { from: "#ec4899", to: "#c026d3", icon: PenTool },
    "qrcode":           { from: "#8b5cf6", to: "#7c3aed", icon: QrCode },
    "lorem-ipsum":      { from: "#ec4899", to: "#db2777", icon: TextCursorInput },
    "random-string":    { from: "#ec4899", to: "#a855f7", icon: Shuffle },
    "random-group":     { from: "#ec4899", to: "#c026d3", icon: Dice1 },
    "uuid":             { from: "#8b5cf6", to: "#7c3aed", icon: Fingerprint },
    "image-to-pixel":   { from: "#3b82f6", to: "#06b6d4", icon: Grid3X3 },
    "password-generator":{from:"#ef4444",to:"#dc2626",icon:Shield},

    // === Text Tools ===
    "case-converter":      { from: "#f97316", to: "#ea580c", icon: CaseUpper },
    "text-formatter":      { from: "#f97316", to: "#eab308", icon: AlignLeft },
    "diff":                { from: "#ef4444", to: "#dc2626", icon: FileDiff },
    "unicode":             { from: "#8b5cf6", to: "#7c3aed", icon: Hash },
    "string-reverse":      { from: "#f97316", to: "#ea580c", icon: FlipHorizontal },
    "string-statistic":    { from: "#3b82f6", to: "#06b6d4", icon: BarChart3 },
    "slug-generator":      { from: "#22c55e", to: "#10b981", icon: AtSign },
    "rot13":               { from: "#f97316", to: "#ea580c", icon: Shuffle },
    "string-randomize-case":{from:"#f59e0b",to:"#d97706",icon:Shuffle},
    "quote":               { from: "#f59e0b", to: "#eab308", icon: QuoteIcon },
    "censor":              { from: "#ef4444", to: "#dc2626", icon: MinusCircle },
    "palindrome":          { from: "#8b5cf6", to: "#7c3aed", icon: RefreshCw },
    "tts":                 { from: "#ec4899", to: "#a855f7", icon: Volume2 },
    "remove-duplicate-lines":{from:"#ef4444",to:"#dc2626",icon:MinusCircle},
    "string-rotate":       { from: "#f97316", to: "#ea580c", icon: RefreshCw },
    "string-split":        { from: "#22c55e", to: "#10b981", icon: Split },
    "string-join":         { from: "#22c55e", to: "#10b981", icon: WrapText },
    "string-repeat":       { from: "#f59e0b", to: "#eab308", icon: Repeat },
    "text-replacer":       { from: "#f97316", to: "#ea580c", icon: Type },
    "morse-code":         { from: "#8b5cf6", to: "#7c3aed", icon: Radio },
    "extract-substring":   { from: "#f97316", to: "#ea580c", icon: Scissors },
    "hidden-character-detector":{from:"#8b5cf6",to:"#7c3aed",icon:Eye},
    "check-leap-years":    { from: "#3b82f6", to: "#06b6d4", icon: CalendarDays },
    "convert-days-to-hours":{from:"#22c55e",to:"#10b981",icon:Calculator},
    "convert-hours-to-days":{from:"#22c55e",to:"#10b981",icon:Calculator},
    "convert-seconds-to-time":{from:"#22c55e",to:"#10b981",icon:Clock4},
    "convert-time-to-seconds":{from:"#22c55e",to:"#10b981",icon:Clock4},
    "convert-time-to-decimal":{from:"#f59e0b",to:"#eab308",icon:Calculator},
    "convert-unix-to-date":{from:"#3b82f6",to:"#06b6d4",icon:CalendarDays},
    "crontab-guru":       { from: "#ec4899", to: "#a855f7", icon: Timer },
    "truncate-clock-time":{from:"#f59e0b",to:"#eab308",icon:Clock4},
    "list-reverse":       { from: "#f97316", to: "#ea580c", icon: FlipHorizontal },
    "list-shuffle":       { from: "#ec4899", to: "#a855f7", icon: Shuffle },
    "list-sort":          { from: "#22c55e", to: "#10b981", icon: SortAsc },
    "list-duplicate":     { from: "#ef4444", to: "#dc2626", icon: Copy },
    "list-unique":        { from: "#22c55e", to: "#10b981", icon: CheckSquare },
    "list-wrap":          { from: "#22c55e", to: "#10b981", icon: WrapText },
    "list-unwrap":        { from: "#f97316", to: "#ea580c", icon: MinusCircle },
    "list-truncate":      { from: "#ef4444", to: "#dc2626", icon: Scissors },
    "list-rotate":        { from: "#f97316", to: "#ea580c", icon: RefreshCw },
    "string-uppercase":   { from: "#f97316", to: "#ea580c", icon: CaseUpper },
    "randomize-case":     { from: "#f59e0b", to: "#d97706", icon: Shuffle },
    "string-remove-duplicates":{from:"#ef4444",to:"#dc2626",icon:MinusCircle},
    "string-truncate":    { from: "#ef4444", to: "#dc2626", icon: Scissors },
    "string-quote":       { from: "#f59e0b", to: "#eab308", icon: QuoteIcon },
    "string-palindrome":  { from: "#8b5cf6", to: "#7c3aed", icon: RefreshCw },

    // === Image Tools (每个工具独立图标!) ===
    "image-resize":            { from: "#3b82f6", to: "#06b6d4", icon: ZoomIn },
    "image-crop":              { from: "#3b82f6", to: "#06b6d4", icon: Crop },
    "image-change-opacity":     { from: "#8b5cf6", to: "#a855f7", icon: Droplets },
    "image-create-transparent": { from: "#ec4899", to: "#c026d3", icon: Wand2 },
    "image-split":             { from: "#3b82f6", to: "#06b6d4", icon: Split },
    "image-compress":          { from: "#3b82f6", to: "#8b5cf6", icon: Minus },
    "image-convert":           { from: "#3b82f6", to: "#06b6d4", icon: ArrowRightLeft },
    "image-rotate":            { from: "#3b82f6", to: "#06b6d4", icon: RotateCw },
    "image-color-palette":     { from: "#ec4899", to: "#a855f7", icon: ColorPalette },
    "image-favicon":           { from: "#3b82f6", to: "#06b6d4", icon: Fingerprint },
    "image-strip-metadata":    { from: "#ef4444", to: "#dc2626", icon: LockOpen },
    "image-info":              { from: "#3b82f6", to: "#06b6d4", icon: Info },
    "image-border":            { from: "#3b82f6", to: "#06b6d4", icon: Frame },
    "image-watermark":         { from: "#3b82f6", to: "#8b5cf6", icon: Stamp },
    "image-color-adjust":      { from: "#ec4899", to: "#a855f7", icon: Contrast },
    "id-photo":                { from: "#3b82f6", to: "#06b6d4", icon: User },
    "image-passport-photo":    { from: "#3b82f6", to: "#06b6d4", icon: Camera },
    "image-generate-memes":    { from: "#ec4899", to: "#a855f7", icon: Sparkles },
    "image-beautify-screenshots":{from:"#3b82f6",to:"#06b6d4",icon:Wand2},
    "find-duplicates":         { from: "#3b82f6", to: "#8b5cf6", icon: Grid3X3 },
    "file-viewer":             { from: "#6366f1", to: "#8b5cf6", icon: FileText },
    "create-gif":              { from: "#ec4899", to: "#a855f7", icon: Play },
    "handwriting-animation":   { from: "#ec4899", to: "#a855f7", icon: Pencil },
    "html-visual-editor":      { from: "#f97316", to: "#ea580c", icon: CodeXml },

    // === Time Tools ===
    "unix-to-date":        { from: "#3b82f6", to: "#06b6d4", icon: CalendarDays },
    "discord-timestamp":   { from: "#8b5cf6", to: "#7c3aed", icon: Clock4 },
    "seconds-to-time":     { from: "#22c55e", to: "#10b981", icon: Clock4 },
    "time-between-dates":  { from: "#3b82f6", to: "#06b6d4", icon: CalendarRange },
    "cron-parser":         { from: "#ec4899", to: "#a855f7", icon: Timer },
    "leap-year":           { from: "#3b82f6", to: "#06b6d4", icon: CalendarDays },

    // === Line Tools ===
    "shuffle-lines":       { from: "#ec4899", to: "#a855f7", icon: Shuffle },
    "sort-lines":          { from: "#22c55e", to: "#10b981", icon: SortAsc },
    "unique-lines":        { from: "#22c55e", to: "#10b981", icon: CheckSquare },
    "csv-to-json":         { from: "#22c55e", to: "#10b981", icon: FileSpreadsheet },
    "json-to-csv":         { from: "#22c55e", to: "#10b981", icon: Table },
    "days-to-hours":       { from: "#22c55e", to: "#10b981", icon: Calculator },
    "hours-to-days":       { from: "#22c55e", to: "#10b981", icon: Calculator },
    "time-to-seconds":     { from: "#22c55e", to: "#10b981", icon: Clock4 },
    "truncate-time":       { from: "#f59e0b", to: "#eab308", icon: Clock4 },
    "duplicate-lines":     { from: "#ef4444", to: "#dc2626", icon: Copy },
    "find-popular":        { from: "#ec4899", to: "#a855f7", icon: TrendingUp },
    "reverse-lines":       { from: "#f97316", to: "#ea580c", icon: FlipHorizontal },
    "rotate-lines":        { from: "#f97316", to: "#ea580c", icon: RefreshCw },
    "wrap-lines":          { from: "#22c55e", to: "#10b981", icon: WrapText },
    "xml-beautifier":      { from: "#f97316", to: "#ea580c", icon: CodeXml },
    "xml-validator":       { from: "#f97316", to: "#ef4444", icon: CheckSquare },
    "escape-json":         { from: "#f59e0b", to: "#eab308", icon: Braces },
    "csv-to-xml":          { from: "#22c55e", to: "#10b981", icon: FileCode },
    "truncate-lines":      { from: "#ef4444", to: "#dc2626", icon: Scissors },
    "unwrap-lines":        { from: "#f97316", to: "#ea580c", icon: MinusCircle },
    "csv-to-yaml":         { from: "#22c55e", to: "#10b981", icon: FileText },
    "tsv-to-json":         { from: "#22c55e", to: "#10b981", icon: FileSpreadsheet },
    "transpose-csv":       { from: "#22c55e", to: "#10b981", icon: ArrowDownUp },
    "json-to-xml":         { from: "#f97316", to: "#ea580c", icon: FileCode },
    "sort-json":           { from: "#22c55e", to: "#10b981", icon: SortAsc },
    "stringify-json":      { from: "#f59e0b", to: "#eab308", icon: Braces },
    "find-incomplete-csv": { from: "#ef4444", to: "#dc2626", icon: AlertTriangle },
    "insert-csv-column":   { from: "#22c55e", to: "#10b981", icon: PlusCircle },
    "swap-csv-columns":    { from: "#f97316", to: "#ea580c", icon: ArrowLeftRight },
    "csv-rows-to-columns": { from: "#22c55e", to: "#10b981", icon: Grid3X3 },
    "group-lines":         { from: "#22c55e", to: "#10b981", icon: Layers },
    "text-compare":        { from: "#ef4444", to: "#dc2626", icon: FileDiff },
    "arithmetic-sequence": { from: "#22c55e", to: "#10b981", icon: Calculator },
    "random-number-generator":{from:"#ec4899",to:"#a855f7",icon:Dice1},

    // === Network ===
    "ip-calc":             { from: "#3b82f6", to: "#06b6d4", icon: Calculator },
    "random-port-generator":{from:"#22c55e",to:"#10b981",icon:Radio},
    "user-agent":          { from: "#6366f1", to: "#8b5cf6", icon: Monitor },

    // === Utility ===
    "coin-flip":           { from: "#ec4899", to: "#a855f7", icon: Dice1 },
    "counter":             { from: "#22c55e", to: "#10b981", icon: Hash },
    "countdown":           { from: "#ef4444", to: "#dc2626", icon: AlarmClock },
    "stopwatch":           { from: "#22c55e", to: "#10b981", icon: Timer },
    "pomodoro":            { from: "#ef4444", to: "#dc2626", icon: Timer },
    "wheel":               { from: "#ec4899", to: "#a855f7", icon: Gamepad2 },
    "scoreboard":          { from: "#f59e0b", to: "#eab308", icon: Trophy },
    "keyboard":            { from: "#6366f1", to: "#8b5cf6", icon: Keyboard },

    // PDF
    "pdf-tools":           { from: "#ef4444", to: "#f97316", icon: FileText },
  };

  function getToolStyle(toolId: string) {
    return TOOL_STYLE_MAP[toolId] || { from: "#6366f1", to: "#a855f7", icon: Cpu };
  }

  const filtered = useMemo(() => {
    const pinned = ["pdf-tools", "file-viewer", ...imageToolIds];
    return toolDirs
      .filter((dirName) => {
        const meta = toolMeta[dirName];
        if (!meta) return false;

        const matchesSearch =
          !search ||
          meta.title.toLowerCase().includes(search.toLowerCase()) ||
          meta.desc.toLowerCase().includes(search.toLowerCase()) ||
          dirName.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
          !activeCategory || meta.category === activeCategory;

        const matchesFavorite = !showFavoritesOnly || isFavorited(dirName);

        return matchesSearch && matchesCategory && matchesFavorite;
      })
      .sort((a, b) => {
        // Favorited items always on top
        const aFav = isFavorited(a);
        const bFav = isFavorited(b);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;

        const aIdx = pinned.indexOf(a);
        const bIdx = pinned.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.localeCompare(b);
      });
  }, [toolDirs, search, activeCategory, showFavoritesOnly, isFavorited]);

  const categoryCounts: Record<string, number> = {};
  for (const dirName of toolDirs) {
    const meta = toolMeta[dirName];
    if (meta) {
      categoryCounts[meta.category] =
        (categoryCounts[meta.category] || 0) + 1;
    }
  }

  return (
    <div>
      {/* Page Header */}
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              🛠️ Tools
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Free Online Tools
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {toolDirs.length}+ free online tools, no download required.
            </p>
          </div>
        </div>
      </section>

      {/* Search + Filter */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Search bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={
                  activeCategory === null && !showFavoritesOnly
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => {
                  setActiveCategory(null);
                  setShowFavoritesOnly(false);
                }}
                className="rounded-full"
              >
                All ({toolDirs.length})
              </Button>
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowFavoritesOnly(!showFavoritesOnly);
                  setActiveCategory(null);
                }}
                className="rounded-full"
              >
                <Star
                  className={cn(
                    "mr-1 h-3.5 w-3.5",
                    showFavoritesOnly
                      ? "fill-current"
                      : "fill-transparent"
                  )}
                />
                Favorites ({favorites.size})
              </Button>
              {CATEGORY_LIST.map(({ key, label }) => {
                const count = categoryCounts[label] || 0;
                if (count === 0) return null;
                return (
                  <Button
                    key={key}
                    variant={activeCategory === label ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setActiveCategory(
                        activeCategory === label ? null : label
                      );
                      setShowFavoritesOnly(false);
                    }}
                    className="rounded-full"
                  >
                    {label} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">
              {activeCategory || "All Tools"} ({filtered.length})
            </h2>
            {search && (
              <p className="mt-1 text-sm text-muted-foreground">
                Search results for: &quot;{search}&quot;
              </p>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No tools found.</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearch("");
                  setActiveCategory(null);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((dirName) => {
                const meta = toolMeta[dirName];
                if (!meta) return null;
                const grad = getToolStyle(dirName);
                const ToolIcon = grad.icon;

                return (
                  <GlassCard
                    key={dirName}
                    gradientFrom={grad.from}
                    gradientTo={grad.to}
                    className="flex flex-col transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl"
                  >
                    <GlassCardHeader>
                      {/* 图标行 */}
                      <div className="flex items-start justify-between">
                        {/* 渐变图标圆球 */}
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl shadow-md ring-1 ring-black/[0.04] transition-all duration-300 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                          }}
                        >
                          <ToolIcon
                            className="h-5 w-5 text-white"
                          />
                        </div>

                        {/* Badge + Star */}
                        <div className="flex items-center gap-1.5">
                          {meta.badge && (
                            <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                              {meta.badge}
                            </span>
                          )}
                          <StarButton
                            isActive={isFavorited(dirName)}
                            onClick={() => toggle(dirName)}
                          />
                        </div>
                      </div>

                      {/* 标题 */}
                      <GlassCardTitle className="mt-4 text-base leading-tight">
                        {meta.title}
                      </GlassCardTitle>

                      {/* 描述 */}
                      <GlassCardDescription className="mt-1.5 line-clamp-2">
                        {meta.desc}
                      </GlassCardDescription>

                      {/* 分类标签 */}
                      <div className="mt-2.5 inline-flex self-start">
                        <span
                          className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors"
                          style={{
                            borderColor: `${grad.from}30`,
                            color: `${grad.from}`,
                            background: `${grad.from}08`,
                          }}
                        >
                          {meta.category}
                        </span>
                      </div>
                    </GlassCardHeader>

                    <GlassCardContent className="mt-auto pt-4">
                      {meta.external && meta.url ? (
                        <a href={meta.url} target="_blank" rel="noopener noreferrer">
                          <Button
                            className="w-full rounded-lg font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
                            size="sm"
                            style={{
                              background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                            }}
                          >
                            Open Tool
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </a>
                      ) : (
                        <Link href={`/tools/${dirName}`}>
                          <Button
                            className="w-full rounded-lg font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
                            size="sm"
                            style={{
                              background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                            }}
                          >
                            Open Tool
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </GlassCardContent>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
