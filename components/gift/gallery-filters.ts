import type { GiftCard } from "@/features/gifts/queries";

/** The tabs on My Gifts, in the order shown. */
export const GALLERY_FILTERS = ["all", "drafts", "shared", "opened"] as const;
export type GalleryFilter = (typeof GALLERY_FILTERS)[number];

export function isGalleryFilter(value: unknown): value is GalleryFilter {
  return GALLERY_FILTERS.includes(value as GalleryFilter);
}

/**
 * The tabs a gift shows under, besides "all". Anything without a working
 * link counts as a draft, so every gift has a tab. "Opened" follows the
 * status chip: a live gift that has been opened at least once.
 */
export function galleryGroups({ gift, recipient }: Pick<GiftCard, "gift" | "recipient">): GalleryFilter[] {
  if (gift.status !== "published") return ["drafts"];
  return recipient?.first_opened_at ? ["shared", "opened"] : ["shared"];
}
