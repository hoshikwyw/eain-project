import { useTranslations } from "next-intl";
import { Chip } from "@/components/ui/chip";
import type { GiftStatus } from "@/types/database";

type Props = { status: GiftStatus; opened: boolean };

export function GiftStatusChip({ status, opened }: Props) {
  const t = useTranslations("dashboard.gifts.status");
  if (status === "published" && opened) return <Chip tone="success">{t("opened")}</Chip>;
  if (status === "published") return <Chip tone="brand">{t("published")}</Chip>;
  if (status === "unpublished") return <Chip tone="neutral">{t("unpublished")}</Chip>;
  return <Chip tone="neutral">{t("draft")}</Chip>;
}
