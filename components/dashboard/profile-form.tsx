"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type ProfileFormState } from "@/features/profile/actions";
import type { Profile } from "@/types/database";
import { SettingsGroup, settingsRow } from "./settings-group";

const LANGUAGES = [
  ["en", "English"],
  ["my", "မြန်မာ"],
] as const;

/** An on/off switch that posts like a checkbox. */
function Switch({ name, defaultChecked }: { name: string; defaultChecked: boolean }) {
  return (
    <span className="relative inline-flex h-7 w-12 shrink-0">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
      />
      <span className="absolute inset-0 rounded-full border border-border bg-muted ring-offset-2 ring-offset-card transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring/60" />
      <span className="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </span>
  );
}

/**
 * The part of settings that is saved to the profile: the name, the
 * language and which notifications to get, in groups, with one save
 * button. The theme sits with the language but applies at once, since it
 * belongs to this browser and not to the profile.
 */
export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations("dashboard.settings");
  const tSettings = useTranslations("settings");
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <SettingsGroup title={t("profile")} className="flex flex-col gap-1.5 p-4 sm:p-5">
        <Label htmlFor="displayName">{t("displayName")}</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={profile.display_name}
          maxLength={80}
          required
        />
        <p className="text-xs text-muted-foreground">{t("profileDescription")}</p>
      </SettingsGroup>

      <SettingsGroup title={t("preferences")} className="divide-y divide-border">
        <div className={settingsRow}>
          <span id="locale-label">{t("language")}</span>
          <div
            role="radiogroup"
            aria-labelledby="locale-label"
            className="inline-flex gap-1 rounded-full bg-secondary p-1"
          >
            {LANGUAGES.map(([value, label]) => (
              <label
                key={value}
                lang={value}
                className="cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors has-checked:bg-card has-checked:text-foreground has-checked:shadow-soft has-focus-visible:ring-2 has-focus-visible:ring-ring/60"
              >
                <input
                  type="radio"
                  name="locale"
                  value={value}
                  defaultChecked={profile.locale === value}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className={settingsRow}>
          <span>{tSettings("theme")}</span>
          <ThemeToggle />
        </div>
      </SettingsGroup>

      <SettingsGroup title={t("notifications")} className="divide-y divide-border">
        <label className={settingsRow}>
          {t("notifyOnOpen")}
          <Switch name="notifyOnOpen" defaultChecked={profile.notify_on_open} />
        </label>
        <label className={settingsRow}>
          {t("notifyOnResponse")}
          <Switch name="notifyOnResponse" defaultChecked={profile.notify_on_response} />
        </label>
      </SettingsGroup>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
        <span role="status" className="text-sm">
          {state.status === "saved" && <span className="text-success">{t("saved")}</span>}
          {state.status === "invalid" && <span className="text-destructive">{t("invalid")}</span>}
          {state.status === "error" && <span className="text-destructive">{t("error")}</span>}
        </span>
      </div>
    </form>
  );
}
