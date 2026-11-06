import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Bird, Lovebirds } from "@/components/brand/lovebirds";
import { cn } from "@/lib/utils";
import { PageTitle } from "@/components/ui/page-title";

type Props = {
  /** Which mascot stands on the page. The pair is for "nothing here"; one bird for news about you. */
  bird?: "pink" | "blue" | "pair";
  title: string;
  text: string;
  /** Buttons under the text. */
  children?: React.ReactNode;
  /** A small line under the buttons, such as an error reference. */
  note?: React.ReactNode;
  /** Show the Eain logo as a way home. For pages with no header of their own. */
  logo?: boolean;
  className?: string;
};

/**
 * A page that only has something to say: not found, went wrong, not
 * available, account deleted. A bird, a title, a sentence and one or two
 * buttons, centred, the same everywhere.
 */
export function StatusPage({ bird = "pair", title, text, children, note, logo, className }: Props) {
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center", className)}>
      <div className={bird === "pair" ? "w-full max-w-60" : "w-full max-w-36"}>{bird === "pair" ? <Lovebirds /> : <Bird variant={bird} />}</div>
      <div className="flex flex-col gap-2">
        <PageTitle className="text-balance my:text-wrap">{title}</PageTitle>
        <p className="mx-auto max-w-md text-muted-foreground">{text}</p>
      </div>
      {children && <div className="flex flex-wrap items-center justify-center gap-2">{children}</div>}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {logo && (
        <Link href="/" aria-label="Eain" className="mt-2 rounded-lg">
          <Logo />
        </Link>
      )}
    </div>
  );
}
