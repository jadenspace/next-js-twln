"use client";

import { cn } from "@/shared/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 md:mb-8 text-left", className)}>
      <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-1 md:mb-2">
        {title}
      </h1>
      {description && (
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
