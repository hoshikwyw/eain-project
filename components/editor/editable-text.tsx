"use client";

import { useLayoutEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Shown while the text is empty, and read out as the field's name. */
  placeholder: string;
  max: number;
  /** Allows line breaks. Single-line texts turn a pasted break into a space. */
  multiline?: boolean;
  field: string;
  index?: number;
};

/**
 * The text as the DOM holds it. Not innerText, which applies text-transform
 * and would save "HELLO" for a design that only shows capitals.
 */
function readText(el: Node): string {
  let out = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) out += node.textContent ?? "";
    else if (node.nodeName === "BR") out += "\n";
    else out += (out && !out.endsWith("\n") ? "\n" : "") + readText(node);
  });
  return out.replace(/ /g, " ");
}

function caretToEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * A text on the gift that is typed into in place. The browser owns the text
 * while it is edited, so the caret never jumps; React only writes it when the
 * value changes from somewhere else (the side panel).
 */
export function EditableText({ value, onChange, placeholder, max, multiline, field, index }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  // Rendered once so the server and the first paint already show the text.
  const [initial] = useState(value);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && readText(el) !== value) el.textContent = value;
  }, [value]);

  const commit = (el: HTMLElement, composing: boolean) => {
    const text = readText(el);
    // An input method (Burmese, for one) is still building the text: leave the DOM alone.
    if (composing) return onChange(text);
    let clean = multiline ? text : text.replace(/\s*\n+\s*/g, " ");
    if (clean.length > max) clean = clean.slice(0, max);
    if (clean.trim() === "") clean = "";
    if (clean !== text) {
      el.textContent = clean;
      if (clean) caretToEnd(el);
    }
    onChange(clean);
  };

  return (
    <span
      ref={ref}
      className="editable-text"
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={placeholder}
      aria-multiline={multiline || undefined}
      data-placeholder={placeholder}
      data-text-field={field}
      data-text-index={index}
      spellCheck={false}
      onInput={(e) => commit(e.currentTarget, (e.nativeEvent as InputEvent).isComposing)}
      onCompositionEnd={(e) => commit(e.currentTarget, false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") e.currentTarget.blur();
        if (e.key === "Enter" && !multiline && !e.nativeEvent.isComposing) e.preventDefault();
      }}
    >
      {initial}
    </span>
  );
}
