import * as React from "react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// ─── Glassmorphism Card (keeps same props interface as shadcn Card) ───────

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { gradientFrom?: string; gradientTo?: string }
>(({ className, gradientFrom = "#3b82f6", gradientTo = "#8b5cf6", children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20",
      className
    )}
    {...props}
  >
    {/* Hover light bloom */}
    <div
      className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom}15, transparent 40%, transparent 60%, ${gradientTo}15)`,
        filter: "blur(8px)",
      }}
    />
    <div className="relative p-5 sm:p-6">{children}</div>
  </div>
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-3", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { gradientFrom?: string; gradientTo?: string }
>(({ className, gradientFrom, gradientTo, children, ...props }, ref) => {
  const style = gradientFrom && gradientTo ? {
    background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties : undefined;
  return (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      style={style}
      {...props}
    >
      {children}
    </h3>
  );
});
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";
