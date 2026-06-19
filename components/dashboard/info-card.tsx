import { Users } from "lucide-react"

import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle
} from "@/components/ui/glass-card";

export default function InfoCard() {
  return (
    <GlassCard>
      <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <GlassCardTitle className="text-sm font-medium">Subscriptions</GlassCardTitle>
        <Users className="size-4 text-muted-foreground" />
      </GlassCardHeader>
      <GlassCardContent>
        <div className="text-2xl font-bold">+2350</div>
        <p className="text-xs text-muted-foreground">+180.1% from last month</p>
      </GlassCardContent>
    </GlassCard>
  )
}
