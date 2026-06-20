import { cn } from "@/lib/utils";

export default function AnimatedGradientText({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-size animate-bg-position bg-linear-to-r from-blue-600 from-30% via-violet-600 via-50% to-cyan-500 to-80% bg-size-[200%_auto] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </div>
  );
}
