import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface SectionContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  className?: string;
  id?: string;
}

/**
 * Unified section container component
 * Provides consistent spacing, typography, and layout for all directory sections
 * 
 * Spacing specification:
 * - Section top/bottom padding: py-12 (default) or py-16 (featured sections)
 * - Gap between sections: 48px (py-12) or 64px (py-16)
 * - Inner content gap: 24px (mb-6) or 32px (mb-8)
 */
export function SectionContainer({
  children,
  title,
  subtitle,
  icon,
  badge,
  className = "",
  id,
}: SectionContainerProps) {
  return (
    <section className={`py-8 md:py-12 ${className}`} id={id}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-6 md:mb-8 text-center">
          {badge && (
            <Badge variant="secondary" className="mb-3 md:mb-4">
              {badge}
            </Badge>
          )}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-muted-foreground text-base md:text-lg">
              {subtitle}
            </p>
          )}
        </div>

        {/* Section content */}
        {children}
      </div>
    </section>
  );
}
