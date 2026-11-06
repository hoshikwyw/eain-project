import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { GiftCard } from "@/features/gifts/queries";
import { GiftStatusChip } from "./gift-status-chip";
import { GiftThumb } from "./gift-thumb";

type Props = {
  card: GiftCard;
  senderName: string;
  /** Buttons shown under the caption, such as edit and delete. They sit beside the link, never inside it. */
  actions?: React.ReactNode;
};

/**
 * One gift in a gallery: its picture, its name and status, who it is for,
 * and when it last changed. The picture and caption are one link. A draft
 * goes back into the editor; a shared gift goes to its own page.
 */
export async function GiftTile({ card, senderName, actions }: Props) {
  const t = await getTranslations("dashboard.gifts");
  const format = await getFormatter();
  const { gift, recipient } = card;
  const href = gift.status === "draft" ? `/create/${gift.id}` : `/dashboard/gifts/${gift.id}`;

  return (
    <div className="flex flex-col gap-2.5">
      <Link href={href} className="group flex flex-col gap-2.5 rounded-2xl outline-none">
        <GiftThumb
          card={card}
          senderName={senderName}
          className="shadow-soft ring-1 ring-border transition-transform duration-200 group-hover:-translate-y-1 group-focus-visible:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-ring"
        />
        <div className="min-w-0 px-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold">{gift.title}</p>
            <GiftStatusChip status={gift.status} opened={Boolean(recipient?.first_opened_at)} />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {recipient?.name ? t("for", { name: recipient.name }) : t("noRecipient")}
            {" · "}
            {format.relativeTime(new Date(gift.updated_at))}
          </p>
        </div>
      </Link>
      {actions}
    </div>
  );
}
