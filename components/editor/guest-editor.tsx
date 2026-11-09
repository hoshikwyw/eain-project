"use client";

import { useSyncExternalStore } from "react";
import type { EditorPayload } from "@/features/gifts/schemas";
import type { TemplateStyle } from "@/features/gifts/templates";
import { EditorSkeleton } from "./editor-skeleton";
import { GiftEditor } from "./gift-editor";
import { readGuestDraft } from "./use-guest-draft";

type Props = {
  /** The template being tried. */
  template: string;
  style: TemplateStyle;
  /** The template as it starts, before the visitor changes anything. */
  start: EditorPayload;
};

const neverChanges = () => () => {};

/**
 * The editor for a visitor without an account. Their work lives in this
 * browser, so the editor is drawn only once the browser is there to ask:
 * a draft of this template from an earlier visit is put back, otherwise
 * the template starts fresh. Until then the page shows its skeleton.
 */
export function GuestEditor({ template, style, start }: Props) {
  const inBrowser = useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
  if (!inBrowser) return <EditorSkeleton />;

  const draft = readGuestDraft();
  const gift = draft && draft.template === template ? draft.payload : start;

  return (
    <main className="flex flex-1 flex-col">
      <GiftEditor
        giftId={null}
        guest={{ template }}
        status="draft"
        opened={false}
        title={gift.title}
        recipientName={gift.recipientName}
        variant={gift.variant}
        opening={gift.opening}
        colors={gift.colors}
        stickers={gift.stickers}
        scene={gift.scene}
        sections={gift.sections}
        media={[]}
        style={style}
        senderName=""
      />
    </main>
  );
}
