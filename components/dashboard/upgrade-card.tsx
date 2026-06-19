import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle
} from "@/components/ui/glass-card";

export function UpgradeCard() {
  return (
    <GlassCard className="md:max-xl:rounded-none md:max-xl:border-none md:max-xl:shadow-none">
      <GlassCardHeader className="md:max-xl:px-4">
        <GlassCardTitle>Upgrade to Pro</GlassCardTitle>
        <GlassCardDescription>
          Unlock all features and get unlimited access to our support team.
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="md:max-xl:px-4">
        <Button size="sm" className="w-full">
          Upgrade
        </Button>
      </GlassCardContent>
    </GlassCard>
  );
}
