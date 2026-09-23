"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type ProfileFormState } from "@/features/profile/actions";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations("dashboard.settings");
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {});

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">{t("displayName")}</Label>
        <Input id="displayName" name="displayName" defaultValue={profile.display_name} maxLength={80} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="locale">{t("language")}</Label>
        <select
          id="locale"
          name="locale"
          defaultValue={profile.locale}
          className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <option value="en">English</option>
          <option value="my" lang="my">
            မြန်မာ
          </option>
        </select>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold">{t("notifications")}</legend>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="notifyOnOpen"
            defaultChecked={profile.notify_on_open}
            className="size-4 accent-primary"
          />
          {t("notifyOnOpen")}
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="notifyOnResponse"
            defaultChecked={profile.notify_on_response}
            className="size-4 accent-primary"
          />
          {t("notifyOnResponse")}
        </label>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
        {state.status === "saved" && <span className="text-sm text-success">{t("saved")}</span>}
        {state.status === "invalid" && <span className="text-sm text-destructive">{t("invalid")}</span>}
        {state.status === "error" && <span className="text-sm text-destructive">{t("error")}</span>}
      </div>
    </form>
  );
}
