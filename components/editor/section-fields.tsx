"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QUESTION_KINDS, REACTIONS, type MediaItem, type QuestionKind, type Section } from "@/features/gifts/schemas";
import { PhotoPicker } from "./photo-picker";

const selectClass =
  "h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

type Props = {
  section: Section;
  onChange: (section: Section) => void;
  giftId: string;
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
};

const textareaClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

/** Type-specific fields for one section. */
export function SectionFields({ section, onChange, giftId, media, onMediaChange }: Props) {
  const t = useTranslations("editor.fields");
  const id = section.id;

  switch (section.type) {
    case "text":
      return (
        <>
          <Field label={t("heading")} htmlFor={`${id}-heading`}>
            <Input
              id={`${id}-heading`}
              value={section.content.heading}
              maxLength={80}
              required
              onChange={(e) => onChange({ ...section, content: { ...section.content, heading: e.target.value } })}
            />
          </Field>
          <Field label={t("subheading")} htmlFor={`${id}-sub`}>
            <Input
              id={`${id}-sub`}
              value={section.content.subheading}
              maxLength={160}
              onChange={(e) => onChange({ ...section, content: { ...section.content, subheading: e.target.value } })}
            />
          </Field>
        </>
      );
    case "message":
      return (
        <Field label={t("message")} htmlFor={`${id}-text`} counter={`${section.content.text.length}/1000`}>
          <textarea
            id={`${id}-text`}
            value={section.content.text}
            maxLength={1000}
            rows={5}
            required
            className={textareaClass}
            onChange={(e) => onChange({ ...section, content: { text: e.target.value } })}
          />
        </Field>
      );
    case "image":
      return (
        <>
          <PhotoPicker
            giftId={giftId}
            media={media}
            onMediaChange={onMediaChange}
            selected={section.content.mediaId ? [section.content.mediaId] : []}
            onSelectedChange={(ids) => onChange({ ...section, content: { ...section.content, mediaId: ids[0] ?? null } })}
            max={1}
          />
          <Field label={t("caption")} htmlFor={`${id}-caption`}>
            <Input
              id={`${id}-caption`}
              value={section.content.caption}
              maxLength={160}
              onChange={(e) => onChange({ ...section, content: { ...section.content, caption: e.target.value } })}
            />
          </Field>
        </>
      );
    case "photo_grid":
      return (
        <>
          <PhotoPicker
            giftId={giftId}
            media={media}
            onMediaChange={onMediaChange}
            selected={section.content.mediaIds}
            onSelectedChange={(ids) => onChange({ ...section, content: { ...section.content, mediaIds: ids } })}
            max={5}
          />
          <Field label={t("caption")} htmlFor={`${id}-caption`}>
            <Input
              id={`${id}-caption`}
              value={section.content.caption}
              maxLength={160}
              onChange={(e) => onChange({ ...section, content: { ...section.content, caption: e.target.value } })}
            />
          </Field>
        </>
      );
    case "timeline": {
      const items = section.content.items;
      const setItems = (next: typeof items) => onChange({ ...section, content: { items: next } });
      return (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                <Input
                  aria-label={t("date")}
                  placeholder={t("date")}
                  value={item.date}
                  maxLength={40}
                  onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, date: e.target.value } : it)))}
                />
                <Input
                  aria-label={t("momentTitle")}
                  placeholder={t("momentTitle")}
                  value={item.title}
                  maxLength={80}
                  required
                  onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, title: e.target.value } : it)))}
                />
              </div>
              <textarea
                aria-label={t("momentText")}
                placeholder={t("momentText")}
                value={item.text}
                maxLength={300}
                rows={2}
                className={textareaClass}
                onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, text: e.target.value } : it)))}
              />
              {items.length > 1 && (
                <Button type="button" variant="ghost" size="sm" className="self-end text-destructive" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <Trash2 />
                  {t("removeMoment")}
                </Button>
              )}
            </div>
          ))}
          {items.length < 8 && (
            <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => setItems([...items, { date: "", title: "", text: "" }])}>
              <Plus />
              {t("addMoment")}
            </Button>
          )}
        </div>
      );
    }
    case "quote":
      return (
        <>
          <Field label={t("quote")} htmlFor={`${id}-quote`}>
            <textarea
              id={`${id}-quote`}
              value={section.content.text}
              maxLength={300}
              rows={3}
              required
              className={textareaClass}
              onChange={(e) => onChange({ ...section, content: { ...section.content, text: e.target.value } })}
            />
          </Field>
          <Field label={t("attribution")} htmlFor={`${id}-attr`}>
            <Input
              id={`${id}-attr`}
              value={section.content.attribution}
              maxLength={80}
              onChange={(e) => onChange({ ...section, content: { ...section.content, attribution: e.target.value } })}
            />
          </Field>
        </>
      );
    case "question": {
      const c = section.content;
      const tq = (key: Parameters<typeof t>[0]) => t(key);
      const defaultOptions = (kind: QuestionKind) => {
        const opt = (label: string) => ({ id: crypto.randomUUID(), label });
        switch (kind) {
          case "yes_no":
            return [opt(tq("yes")), opt(tq("no"))];
          case "reaction":
            return REACTIONS.map((r) => opt(r));
          case "choice":
            return [opt(""), opt("")];
          default:
            return [];
        }
      };
      const setOptions = (options: typeof c.options) => onChange({ ...section, content: { ...c, options } });
      const editableOptions = c.kind === "choice" || c.kind === "yes_no";
      return (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label={t("prompt")} htmlFor={`${id}-prompt`}>
              <Input
                id={`${id}-prompt`}
                value={c.prompt}
                maxLength={300}
                required
                placeholder={t("promptPlaceholder")}
                onChange={(e) => onChange({ ...section, content: { ...c, prompt: e.target.value } })}
              />
            </Field>
            <Field label={t("answerType")} htmlFor={`${id}-kind`}>
              <select
                id={`${id}-kind`}
                value={c.kind}
                className={selectClass}
                onChange={(e) => {
                  const kind = e.target.value as QuestionKind;
                  onChange({ ...section, content: { ...c, kind, options: defaultOptions(kind) } });
                }}
              >
                {QUESTION_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`kinds.${k}`)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {editableOptions && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">{t("options")}</span>
              {c.options.map((o, i) => (
                <div key={o.id} className="flex gap-2">
                  <Input
                    aria-label={t("optionLabel", { n: i + 1 })}
                    value={o.label}
                    maxLength={120}
                    required
                    onChange={(e) => setOptions(c.options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)))}
                  />
                  {c.kind === "choice" && c.options.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" aria-label={t("removeOption")} onClick={() => setOptions(c.options.filter((x) => x.id !== o.id))}>
                      <Trash2 />
                    </Button>
                  )}
                </div>
              ))}
              {c.kind === "choice" && c.options.length < 6 && (
                <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => setOptions([...c.options, { id: crypto.randomUUID(), label: "" }])}>
                  <Plus />
                  {t("addOption")}
                </Button>
              )}
            </div>
          )}

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={c.required}
              onChange={(e) => onChange({ ...section, content: { ...c, required: e.target.checked } })}
              className="size-4 accent-primary"
            />
            {t("required")}
          </label>
        </div>
      );
    }
    case "final_message":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("closingLine")} htmlFor={`${id}-final`}>
            <Input
              id={`${id}-final`}
              value={section.content.text}
              maxLength={300}
              onChange={(e) => onChange({ ...section, content: { ...section.content, text: e.target.value } })}
            />
          </Field>
          <Field label={t("signature")} htmlFor={`${id}-sig`} hint={t("signatureHint")}>
            <Input
              id={`${id}-sig`}
              value={section.content.signature}
              maxLength={80}
              onChange={(e) => onChange({ ...section, content: { ...section.content, signature: e.target.value } })}
            />
          </Field>
        </div>
      );
  }
}

function Field({
  label,
  htmlFor,
  hint,
  counter,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {(hint || counter) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{hint}</span>
          <span>{counter}</span>
        </div>
      )}
    </div>
  );
}
