import {
  GlassCard,
  GlassCardContent,
  GlassCardFooter,
  GlassCardHeader
} from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <GlassCard>
      <GlassCardHeader className="gap-1">
        <Skeleton className="h-5 w-1/5" />
        <Skeleton className="h-3.5 w-2/5" />
      </GlassCardHeader>
      <GlassCardContent className="h-16" />
      <GlassCardFooter className="flex h-14 items-center justify-between border-t bg-accent/50 p-6" />
    </GlassCard>
  );
}
