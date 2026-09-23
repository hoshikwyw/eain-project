import { cn } from "@/lib/utils";

/**
 * Placeholder lovebirds on a branch for hero and empty states.
 * Colours come from theme tokens so the pair is pink and blue in light
 * mode and pink and purple in dark mode.
 */
export function Lovebirds({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 140" fill="none" aria-hidden="true" className={cn("w-full", className)}>
      <path
        d="M10 112c40-6 80 4 120 0s70-14 100-6"
        stroke="var(--branch)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="40" cy="104" r="5" fill="var(--brand-soft)" />
      <circle cx="200" cy="100" r="5" fill="var(--brand-soft)" />
      <circle cx="215" cy="108" r="3.5" fill="var(--brand-soft)" />

      <g className="float-slow">
        <ellipse cx="88" cy="86" rx="26" ry="20" fill="var(--bird-a)" />
        <path d="M70 86c-8 4-12 12-10 20 8-2 14-8 16-14Z" fill="var(--bird-a-wing)" />
        <circle cx="106" cy="66" r="14" fill="var(--bird-a)" />
        <circle cx="111" cy="63" r="2.2" fill="var(--foreground)" />
        <path d="M119 67l8 2-8 3Z" fill="var(--glow)" />
      </g>

      <g className="float-slow" style={{ animationDelay: "1.2s" }}>
        <ellipse cx="152" cy="86" rx="26" ry="20" fill="var(--bird-b)" />
        <path d="M170 86c8 4 12 12 10 20-8-2-14-8-16-14Z" fill="var(--bird-b-wing)" />
        <circle cx="134" cy="66" r="14" fill="var(--bird-b)" />
        <circle cx="129" cy="63" r="2.2" fill="var(--foreground)" />
        <path d="M121 67l-8 2 8 3Z" fill="var(--glow)" />
      </g>

      <path
        d="M120 40c-3-5-10-4-10 1.5 0 4 6 7.5 10 10.5 4-3 10-6.5 10-10.5 0-5.5-7-6.5-10-1.5Z"
        fill="var(--brand)"
      />
    </svg>
  );
}
