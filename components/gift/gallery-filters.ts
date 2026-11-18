import type { GiftCard } from "@/features/gifts/queries";
import { isInvitationDesign } from "@/features/gifts/templates";

/** The tabs on My Gifts, in the order shown. */
export const GALLERY_FILTERS = [
  "all",
  "drafts",
  "shared",
  "opened",
  "answered",
  "invitations",
] as const;
export type GalleryFilter = (typeof GALLERY_FILTERS)[number];

export function isGalleryFilter(value: unknown): value is GalleryFilter {
  return GALLERY_FILTERS.includes(value as GalleryFilter);
}

/**
 * The tabs a gift shows under, besides "all". Anything without a working
 * link counts as a draft, so every gift has a tab. "Opened" follows the
 * status chip: a live gift that has been opened at least once. "Answered"
 * has at least one reply or RSVP; "Invitations" is the kind of card, in any
 * state, so a host finds the guest lists in one place.
 */
export function galleryGroups({
  gift,
  recipient,
  style,
  responses,
}: Pick<GiftCard, "gift" | "recipient" | "style" | "responses">): GalleryFilter[] {
  const groups: GalleryFilter[] =
    gift.status !== "published"
      ? ["drafts"]
      : recipient?.first_opened_at
        ? ["shared", "opened"]
        : ["shared"];
  if (responses > 0) groups.push("answered");
  if (isInvitationDesign(style.design)) groups.push("invitations");
  return groups;
}
