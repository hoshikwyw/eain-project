import type { Section } from "./schemas";

/**
 * An event section as a calendar entry. The creator's words stay on the card;
 * the entry is built from the optional real date and time they set beside
 * them. Times are "floating" (no time zone): the party is at seven wherever
 * the guest's phone thinks it is, which is right for a local event.
 */
export type CalendarEntry = {
  summary: string;
  location: string;
  description: string;
  /** "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM". */
  start: string;
  allDay: boolean;
};

/** How long an event with a start time is assumed to last, in hours. */
const DEFAULT_HOURS = 2;

type EventSection = Extract<Section, { type: "event" }>;

/** The card's first heading names the entry; a fallback ("You're invited") when there is none. */
export function calendarEntry(
  section: EventSection,
  sections: Section[],
  fallbackTitle: string,
): CalendarEntry | null {
  const start = section.content.startsAt ?? "";
  if (!start) return null;
  const heading = sections.find(
    (s): s is Extract<Section, { type: "text" }> =>
      s.type === "text" && Boolean(s.content.heading.trim()),
  );
  return {
    summary: heading?.content.heading.trim() || fallbackTitle,
    location: section.content.place,
    description: section.content.note,
    start,
    allDay: !start.includes("T"),
  };
}

/** Start and end in calendar notation: 20261221T190000, or 20261221 for a whole day. */
export function calendarSpan(entry: CalendarEntry): { start: string; end: string } {
  if (entry.allDay) {
    const day = new Date(`${entry.start}T00:00:00Z`);
    const next = new Date(day.getTime() + 86_400_000);
    return { start: compactDate(day), end: compactDate(next) };
  }
  const start = new Date(`${entry.start}:00Z`);
  const end = new Date(start.getTime() + DEFAULT_HOURS * 3_600_000);
  return { start: compactStamp(start), end: compactStamp(end) };
}

const compactDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
const compactStamp = (d: Date) => d.toISOString().slice(0, 19).replace(/[-:]/g, "");

/** A link that opens Google Calendar with the entry filled in. Works without any file. */
export function googleCalendarUrl(entry: CalendarEntry): string {
  const { start, end } = calendarSpan(entry);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: entry.summary,
    dates: `${start}/${end}`,
  });
  if (entry.location) params.set("location", entry.location);
  if (entry.description) params.set("details", entry.description);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** The entry as an .ics file, for Apple Calendar, Outlook and the rest (RFC 5545). */
export function icsFile(entry: CalendarEntry, uid: string, now = new Date()): string {
  const { start, end } = calendarSpan(entry);
  const dateKind = entry.allDay ? ";VALUE=DATE" : "";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Eain//Invitation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@eain`,
    `DTSTAMP:${compactStamp(now)}Z`,
    `DTSTART${dateKind}:${start}`,
    `DTEND${dateKind}:${end}`,
    `SUMMARY:${escapeText(entry.summary)}`,
    entry.location && `LOCATION:${escapeText(entry.location)}`,
    entry.description && `DESCRIPTION:${escapeText(entry.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => Boolean(l));
  return lines.map(fold).join("\r\n") + "\r\n";
}

const escapeText = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines longer than 75 octets continue on the next line after a space. Counted in bytes, for Burmese. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > 73) {
      out.push(current);
      current = " ";
      bytes = 1;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n");
}
