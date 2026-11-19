"use client";

import BoringAvatar from "boring-avatars";
import { useState } from "react";
import {
  AVATAR_PALETTES,
  resolveAvatar,
  type Avatar,
  type GeneratedAvatar,
} from "@/features/profile/avatar";
import { cn } from "@/lib/utils";

type Props = {
  /** The stored `profiles.avatar_url`, or an already resolved avatar. */
  avatar: string | null | undefined | Avatar;
  /** Seeds the default picture; required so two accounts never share one. */
  userId: string;
  /** Rendered size in CSS pixels; the picture scales to its box anyway. */
  size?: number;
  className?: string;
};

/**
 * One account's picture, wherever an account is shown. Draws the generated
 * avatar, or the provider photo with the generated one as the fallback when
 * the photo does not load. Decorative: the name is always written next to it.
 */
export function UserAvatar({ avatar, userId, size = 40, className }: Props) {
  const resolved = typeof avatar === "object" && avatar ? avatar : resolveAvatar(avatar, userId);
  const [photoFailed, setPhotoFailed] = useState(false);
  const box = cn("block shrink-0 overflow-hidden rounded-full bg-brand-soft", className);

  if (resolved.kind === "photo" && !photoFailed) {
    return (
      <span aria-hidden="true" className={box} style={{ width: size, height: size }}>
        {/* Provider photos live on another origin; a plain img keeps them out of the image pipeline. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolved.src}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          onError={() => setPhotoFailed(true)}
          className="size-full object-cover"
        />
      </span>
    );
  }

  const generated: GeneratedAvatar =
    resolved.kind === "generated" ? resolved : (resolveAvatar(null, userId) as GeneratedAvatar);
  return (
    <span aria-hidden="true" className={box} style={{ width: size, height: size }}>
      <GeneratedPicture avatar={generated} size={size} />
    </span>
  );
}

/** The SVG alone, for pickers that draw many at once. */
export function GeneratedPicture({ avatar, size }: { avatar: GeneratedAvatar; size: number }) {
  return (
    <BoringAvatar
      name={avatar.seed}
      variant={avatar.variant}
      colors={[...AVATAR_PALETTES[avatar.palette]]}
      size={size}
      className="block size-full"
    />
  );
}
