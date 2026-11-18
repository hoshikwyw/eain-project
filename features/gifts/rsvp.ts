import type { Section } from "./schemas";

/**
 * The RSVP deadline a host sets on the event section. The day ends at
 * midnight in Myanmar, whatever the server's or the guest's clock says, so a
 * card that says "RSVP by 1 December" takes replies through that whole day.
 */
const DAY_END_OFFSET = "+06:30";

/** The deadline date ("YYYY-MM-DD") from the first event section that has one. */
export function rsvpDeadline(sections: Section[]): string | null {
  for (const s of sections) if (s.type === "event" && s.content.rsvpBy) return s.content.rsvpBy;
  return null;
}

/** True once the deadline day is over. No deadline, never closed. */
export function rsvpClosed(deadline: string | null, now = new Date()): boolean {
  if (!deadline) return false;
  const end = Date.parse(`${deadline}T23:59:59${DAY_END_OFFSET}`);
  return Number.isFinite(end) && now.getTime() > end;
}
