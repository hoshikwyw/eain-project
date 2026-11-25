"use client";

import { useTranslations } from "next-intl";
import { QueryToasts } from "@/components/ui/query-toasts";

const OK_KEYS = [
  "role",
  "points",
  "template",
  "report",
  "disabled",
  "suspended",
  "unsuspended",
  "deleted",
  "giftsOffline",
  "granted",
] as const;
const ERROR_KEYS = [
  "invalid",
  "failed",
  "ownRole",
  "insufficient",
  "premiumPrice",
  "paidPrice",
  "self",
  "confirmEmail",
  "deleteFailed",
] as const;

/**
 * The result of an admin action, which its redirect carries as `?ok=` or
 * `?error=`, shown as a toast once and then taken off the address.
 */
export function AdminFlash() {
  const t = useTranslations("admin.flash");
  return (
    <QueryToasts
      items={[
        ...OK_KEYS.map((k) => ({
          param: "ok",
          value: k,
          type: "success" as const,
          title: t(`ok.${k}`),
        })),
        ...ERROR_KEYS.map((k) => ({
          param: "error",
          value: k,
          type: "error" as const,
          title: t(`error.${k}`),
        })),
      ]}
    />
  );
}
