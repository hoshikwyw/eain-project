import type { EditableSectionType, Section } from "@/features/gifts/schemas";

/** A new, empty section of a kind, ready to be filled in. */
export function emptySection(type: EditableSectionType): Section {
  const id = crypto.randomUUID();
  switch (type) {
    case "question":
      return {
        id,
        type,
        content: {
          questionId: crypto.randomUUID(),
          kind: "choice",
          prompt: "",
          required: false,
          options: [
            { id: crypto.randomUUID(), label: "" },
            { id: crypto.randomUUID(), label: "" },
          ],
        },
      };
    case "text":
      return { id, type, content: { heading: "", subheading: "" } };
    case "message":
      return { id, type, content: { text: "" } };
    case "image":
      return { id, type, content: { mediaId: null, caption: "" } };
    case "photo_grid":
      return { id, type, content: { mediaIds: [], caption: "" } };
    case "timeline":
      return { id, type, content: { items: [{ date: "", title: "", text: "" }] } };
    case "quote":
      return { id, type, content: { text: "", attribution: "" } };
    case "final_message":
      return { id, type, content: { text: "", signature: "" } };
  }
}

/** A copy of a section under a new id. A question gets ids of its own too, so answers never mix. */
export function copyOfSection(source: Section): Section {
  return source.type === "question"
    ? {
        ...source,
        id: crypto.randomUUID(),
        content: {
          ...source.content,
          questionId: crypto.randomUUID(),
          options: source.content.options.map((o) => ({ ...o, id: crypto.randomUUID() })),
        },
      }
    : { ...source, id: crypto.randomUUID() };
}
