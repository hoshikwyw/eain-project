import type { Motif } from "@/features/gifts/templates";

/**
 * Small line drawings for the invitation cards, one per occasion, drawn in
 * the look's accent colour: the kind of mark a printer would emboss at the
 * head of a formal invitation. Thin strokes on a 64-unit grid.
 */
export function InvitationMotif({ kind, className }: { kind: Motif; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "rings" && (
        <>
          <circle cx="25" cy="36" r="13" />
          <circle cx="39" cy="36" r="13" />
          <path d="M39 23 l-5 -6 h10 z M34 17 l5 -6 l5 6" />
        </>
      )}
      {kind === "glasses" && (
        <>
          <path d="M20 12 h12 l-2 16 a4 4 0 0 1 -8 0 z M26 32 v16 M19 48 h14" />
          <path d="M32 12 h12 l-2 16 a4 4 0 0 1 -8 0 z M38 32 v16 M31 48 h14" opacity="0.55" />
          <path d="M30 7 l1 -3 M34 7 l-1 -3 M32 6 v-3" opacity="0.7" />
        </>
      )}
      {kind === "rattle" && (
        <>
          <circle cx="32" cy="22" r="11" />
          <path d="M32 33 v15 M27 51 a5 5 0 0 0 10 0 a5 5 0 0 0 -10 0" />
          <path d="M14 14 l2 2 M50 14 l-2 2 M12 26 h3 M49 26 h3" opacity="0.7" />
        </>
      )}
      {kind === "cap" && (
        <>
          <path d="M8 26 l24 -10 l24 10 l-24 10 z" />
          <path d="M18 31 v10 c0 4 28 4 28 0 v-10" />
          <path d="M56 26 v14 M56 40 l-2 5 h4 z" />
        </>
      )}
      {kind === "house" && (
        <>
          <path d="M12 32 l20 -18 l20 18" />
          <path d="M17 29 v22 h30 v-22" />
          <path d="M28 51 v-12 h8 v12" />
          <path d="M42 18 v-5 h4 v9" />
        </>
      )}
      {kind === "bowl" && (
        <>
          <path d="M12 32 a20 13 0 0 1 40 0" />
          <path d="M12 32 a20 12 0 0 0 40 0" />
          <path d="M12 32 h40" opacity="0.55" />
          <path d="M29 19.5 l3 -8 l3 8" />
          <path d="M24 44 l-2 8 h20 l-2 -8" />
        </>
      )}
      {kind === "umbrella" && (
        <>
          <path d="M8 30 c4 -15 44 -15 48 0" />
          <path d="M8 30 q4 5 8 0 q4 5 8 0 q4 5 8 0 q4 5 8 0 q4 5 8 0 q4 5 8 0" />
          <path d="M28 17 h8 l-4 -9 z M32 30 v26" />
          <path d="M20 24 l-1 6 M44 24 l1 6" opacity="0.55" />
        </>
      )}
      {kind === "plane" && (
        <>
          <path d="M8 30 l48 -18 l-14 42 l-8 -16 z M34 38 l22 -26" />
          <path d="M10 44 q8 -4 16 -2" opacity="0.6" strokeDasharray="2 3" />
        </>
      )}
    </svg>
  );
}
