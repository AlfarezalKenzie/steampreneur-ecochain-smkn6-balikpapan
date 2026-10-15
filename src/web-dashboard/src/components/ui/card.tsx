import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card dasar dashboard. Sengaja memakai border hairline 1px, BUKAN shadow
 * abu-abu lembut seragam di setiap kartu (ciri khas "SaaS card kit" generik).
 * Shadow (lihat tailwind.config: shadow-popover) dicadangkan hanya utk layer
 * mengambang (dropdown, modal), bukan kartu konten statis.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-hairline bg-surface", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between border-b border-hairline px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-base font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
