"use client";

import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_PHOTOS_PER_GIFT, type MediaItem } from "@/features/gifts/schemas";
import { processImage } from "@/lib/image-client";
import { cn } from "@/lib/utils";

type Props = {
  giftId: string;
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  max: number;
};

/**
 * The gift's photo library. Upload compresses in the browser, then posts to
 * the media route which checks the real bytes before storing.
 */
export function PhotoPicker({ giftId, media, onMediaChange, selected, onSelectedChange, max }: Props) {
  const t = useTranslations("editor.photos");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const full = media.length >= MAX_PHOTOS_PER_GIFT;

  function toggle(id: string) {
    if (selected.includes(id)) {
      onSelectedChange(selected.filter((s) => s !== id));
    } else if (max === 1) {
      onSelectedChange([id]);
    } else if (selected.length < max) {
      onSelectedChange([...selected, id]);
    }
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const processed = await processImage(file);
      const form = new FormData();
      form.set("file", processed.blob, "photo");
      form.set("thumb", processed.thumb, "thumb");
      form.set("width", String(processed.width));
      form.set("height", String(processed.height));
      const res = await fetch(`/api/gifts/${giftId}/media`, { method: "POST", body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error === "limit" ? t("errors.limit") : body.error === "not-image" ? t("errors.notImage") : t("errors.failed"));
        return;
      }
      const item = (await res.json()) as MediaItem;
      onMediaChange([...media, item]);
      toggle(item.id);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setError(code === "too-large" ? t("errors.tooLarge") : code === "not-image" ? t("errors.notImage") : t("errors.failed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    const res = await fetch(`/api/gifts/${giftId}/media`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: id }),
    });
    if (res.ok) {
      onMediaChange(media.filter((m) => m.id !== id));
      onSelectedChange(selected.filter((s) => s !== id));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {media.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <div key={item.id} className="group relative">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={isSelected}
                className={cn(
                  "block aspect-square w-full overflow-hidden rounded-xl border-2 transition-colors",
                  isSelected ? "border-primary" : "border-transparent hover:border-border",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- signed private URL */}
                <img src={item.thumbUrl} alt="" className="size-full object-cover" />
                {isSelected && (
                  <span className="absolute top-1 left-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={t("delete")}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-card/90 text-destructive opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            {busy ? t("uploading") : t("upload")}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <p className="text-xs text-muted-foreground">
        {t("count", { count: media.length, max: MAX_PHOTOS_PER_GIFT })}
        {max > 1 && ` · ${t("selectUpTo", { max })}`}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {full && media.length > 0 && (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => inputRef.current?.click()} disabled>
          {t("limitReached")}
        </Button>
      )}
    </div>
  );
}
