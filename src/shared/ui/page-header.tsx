"use client";

import { cn } from "@/shared/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 md:mb-10 text-center md:text-left", className)}>
      <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight lg:text-5xl mb-1.5 md:mb-3">
        {title}
      </h1>
      {description && (
        <p className="text-sm md:text-xl text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
