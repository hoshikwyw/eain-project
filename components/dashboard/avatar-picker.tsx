"use client";

import { Camera, Shuffle } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GeneratedPicture } from "@/components/ui/user-avatar";
import {
  AVATAR_PALETTES,
  AVATAR_PALETTE_NAMES,
  AVATAR_VARIANTS,
  randomSeed,
  resolveAvatar,
  type GeneratedAvatar,
} from "@/features/profile/avatar";
import { updateAvatar, type AvatarFormState } from "@/features/profile/actions";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { SettingsGroup } from "./settings-group";

type Props = {
  userId: string;
  /** The stored choice, `profiles.avatar_url`. */
  avatarUrl: string | null;
  /** The photo the sign-in provider gave us, when there is one. */
  photoUrl: string | null;
};

const SWATCH =
  "group grid size-11 cursor-pointer place-items-center rounded-full outline-none has-focus-visible:ring-2 has-focus-visible:ring-ring/60";
const TILE =
  "group flex w-20 cursor-pointer flex-col items-center gap-1.5 rounded-2xl py-2 text-center text-xs leading-tight font-semibold text-muted-foreground transition-colors outline-none has-checked:bg-secondary has-checked:text-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring/60";

/**
 * Choosing the account's picture: six drawn styles, five palettes, a
 * shuffle for a new drawing, and the provider photo when there is one.
 * Every choice saves at once; the bar on top and the hero above update
 * when the save lands, and one toast confirms it.
 */
export function AvatarPicker({ userId, avatarUrl, photoUrl }: Props) {
  const t = useTranslations("dashboard.settings");
  const stored = resolveAvatar(avatarUrl, userId);
  const [picture, setPicture] = useState<GeneratedAvatar>(
    stored.kind === "generated" ? stored : (resolveAvatar(null, userId) as GeneratedAvatar),
  );
  const [usingPhoto, setUsingPhoto] = useState(stored.kind === "photo");
  const [state, action, pending] = useActionState<AvatarFormState, FormData>(updateAvatar, {});
  const lastToast = useRef<string | null>(null);

  // Each save answers with a fresh state object, so this runs once per save.
  // A quick run of changes replaces its confirmation instead of stacking them.
  useEffect(() => {
    if (!state.status || state.status === "invalid") return;
    if (lastToast.current) toast.dismiss(lastToast.current);
    lastToast.current =
      state.status === "saved"
        ? toast.success(t("avatarSaved"), { duration: 2500 })
        : toast.error(t("error"));
  }, [state, t]);

  const save = (next: GeneratedAvatar | "photo") => {
    const data = new FormData();
    if (next === "photo") {
      setUsingPhoto(true);
      data.set("mode", "photo");
    } else {
      setUsingPhoto(false);
      setPicture(next);
      data.set("mode", "drawn");
      data.set("variant", next.variant);
      data.set("palette", next.palette);
      data.set("seed", next.seed);
    }
    startTransition(() => action(data));
  };

  return (
    <SettingsGroup title={t("avatar")} className="flex flex-col gap-5 p-4 sm:p-5">
      <p className="text-xs text-muted-foreground">{t("avatarDescription")}</p>

      <fieldset aria-busy={pending} className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{t("avatarStyle")}</legend>
        <div className="flex flex-wrap gap-2">
          {AVATAR_VARIANTS.map((variant) => {
            const option = { ...picture, variant };
            return (
              <label key={variant} className={TILE}>
                <input
                  type="radio"
                  name="variant"
                  value={variant}
                  className="sr-only"
                  checked={!usingPhoto && picture.variant === variant}
                  onChange={() => save(option)}
                />
                <span className="block size-12 overflow-hidden rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-card transition group-has-checked:ring-primary">
                  <GeneratedPicture avatar={option} size={48} />
                </span>
                {t(`avatarStyles.${variant}`)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{t("avatarPalette")}</legend>
        <div className="flex flex-wrap gap-2">
          {AVATAR_PALETTE_NAMES.map((palette) => {
            const colors = AVATAR_PALETTES[palette];
            const wheel = colors.map((c, i) => `${c} ${i * 20}% ${(i + 1) * 20}%`).join(", ");
            return (
              <label key={palette} className={SWATCH} title={t(`avatarPalettes.${palette}`)}>
                <input
                  type="radio"
                  name="palette"
                  value={palette}
                  className="sr-only"
                  checked={!usingPhoto && picture.palette === palette}
                  onChange={() => save({ ...picture, palette })}
                />
                <span
                  aria-hidden="true"
                  className="block size-8 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-card transition group-has-checked:ring-primary"
                  style={{ background: `conic-gradient(${wheel})` }}
                />
                <span className="sr-only">{t(`avatarPalettes.${palette}`)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => save({ ...picture, seed: randomSeed() })}
        >
          <Shuffle />
          {t("avatarShuffle")}
        </Button>
        {photoUrl && (
          <Button
            type="button"
            variant={usingPhoto ? "soft" : "secondary"}
            size="sm"
            aria-pressed={usingPhoto}
            className={cn(usingPhoto && "ring-2 ring-primary ring-offset-2 ring-offset-card")}
            onClick={() => (usingPhoto ? save(picture) : save("photo"))}
          >
            <Camera />
            {t("avatarPhoto")}
          </Button>
        )}
      </div>
    </SettingsGroup>
  );
}
