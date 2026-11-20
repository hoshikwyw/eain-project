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
        /** Premium: brushed gold with a light edge, the same in both themes. */
        gold: "bg-[linear-gradient(135deg,var(--gold-soft),var(--gold))] text-on-gold shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_1px_2px_rgb(0_0_0/0.12)]",
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
