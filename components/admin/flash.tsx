import { useTranslations } from "next-intl";

type Props = { ok?: string; error?: string };

/** One-line result banner for admin actions, driven by ?ok= and ?error=. */
export function AdminFlash({ ok, error }: Props) {
  const t = useTranslations("admin.flash");
  const okKeys = ["role", "points", "template", "report", "disabled"] as const;
  const errorKeys = ["invalid", "failed", "ownRole", "insufficient"] as const;
  const okKey = okKeys.find((k) => k === ok);
  const errorKey = errorKeys.find((k) => k === error);
  if (okKey) {
    return (
      <p role="status" className="rounded-xl bg-success-soft px-3.5 py-2.5 text-sm text-success">
        {t(`ok.${okKey}`)}
      </p>
    );
  }
  if (errorKey) {
    return (
      <p role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
        {t(`error.${errorKey}`)}
      </p>
    );
  }
  return null;
}
