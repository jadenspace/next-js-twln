"use client";

import { LucideIcon } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateCardProps) {
  return (
    <Card
      className={cn(
        "p-6 md:p-12 flex flex-col items-center justify-center text-center border-dashed border-2",
        className,
      )}
    >
      <Icon className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/30 mb-3 md:mb-4" />
      <h3 className="text-base md:text-xl font-bold mb-1.5 md:mb-2">{title}</h3>
      <p className="text-xs md:text-base text-muted-foreground leading-relaxed max-w-sm">
        {description}
      </p>
    </Card>
  );
}
