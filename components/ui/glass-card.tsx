import Link from "next/link";
import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  gradientFrom?: string;
  gradientTo?: string;
  onClick?: () => void;
}

export function GlassCard({ 
  children, 
  className = "",
  href,
  gradientFrom = "#3b82f6",
  gradientTo = "#8b5cf6",
  onClick,
}: GlassCardProps) {
  const inner = (
    <div
      className={`relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-black/10 dark:group-hover:shadow-black/30 group-hover:border-white/30 dark:group-hover:border-white/15 ${className}`}
      onClick={onClick}
    >
      {/* Hover 光晕效果 */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}15, transparent 40%, transparent 60%, ${gradientTo}15)`,
          filter: "blur(8px)",
        }}
      />
      <div className="relative p-5 sm:p-6">{children}</div>
    </div>
  );

  if (href) {
    return <Link href={href} className="group block">{inner}</Link>;
  }
  return <div className="group">{inner}</div>;
}

// ─── 子组件（匹配 shadcn Card API）────────────────────────────────────

export function GlassCardHeader({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 pb-3 ${className}`}>
      {children}
    </div>
  );
}

export function GlassCardContent({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}

export function GlassCardTitle({ className = "", children, gradientFrom, gradientTo }: { className?: string; children: ReactNode; gradientFrom?: string; gradientTo?: string }) {
  const style = gradientFrom && gradientTo ? {
    background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties : undefined;

  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} style={style}>
      {children}
    </h3>
  );
}

export function GlassCardDescription({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {children}
    </p>
  );
}
