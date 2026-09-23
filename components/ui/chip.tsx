import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-neutral-chip-soft text-neutral-chip",
        brand: "bg-brand-soft text-accent-foreground dark:text-brand",
        success: "bg-success-soft text-success",
        primary: "bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

type ChipProps = React.ComponentProps<"span"> & VariantProps<typeof chipVariants>;

function Chip({ className, tone, ...props }: ChipProps) {
  return <span data-slot="chip" className={cn(chipVariants({ tone }), className)} {...props} />;
}

export { Chip, chipVariants };
