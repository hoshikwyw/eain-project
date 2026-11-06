import { useTranslations } from "next-intl";
import { Notice } from "@/components/ui/notice";

type Props = { ok?: string; error?: string };

/** One-line result banner for admin actions, driven by ?ok= and ?error=. */
export function AdminFlash({ ok, error }: Props) {
  const t = useTranslations("admin.flash");
  const okKeys = ["role", "points", "template", "report", "disabled", "suspended", "unsuspended", "deleted", "giftsOffline"] as const;
  const errorKeys = ["invalid", "failed", "ownRole", "insufficient", "premiumPrice", "self", "confirmEmail", "deleteFailed"] as const;
  const okKey = okKeys.find((k) => k === ok);
  const errorKey = errorKeys.find((k) => k === error);
  if (okKey) {
    return (
      <Notice role="status" tone="success">
        {t(`ok.${okKey}`)}
      </Notice>
    );
  }
  if (errorKey) {
    return (
      <Notice role="alert">
        {t(`error.${errorKey}`)}
      </Notice>
    );
  }
  return null;
}
