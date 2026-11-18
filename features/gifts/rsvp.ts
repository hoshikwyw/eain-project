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

const MONTHS = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  my: [
    "ဇန်နဝါရီ",
    "ဖေဖော်ဝါရီ",
    "မတ်",
    "ဧပြီ",
    "မေ",
    "ဇွန်",
    "ဇူလိုင်",
    "ဩဂုတ်",
    "စက်တင်ဘာ",
    "အောက်တိုဘာ",
    "နိုဝင်ဘာ",
    "ဒီဇင်ဘာ",
  ],
} as const;

const myanmarDigits = (n: number) => String(n).replace(/\d/g, (d) => "၀၁၂၃၄၅၆၇၈၉"[Number(d)]);

/**
 * "1 December 2026" or "၂၀၂၆ ဒီဇင်ဘာ ၁", from "2026-12-01". Spelled out here
 * rather than through Intl because many browsers ship no Burmese locale data,
 * and the card is drawn on the server and in the browser and must match.
 */
export function formatDay(iso: string, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const month = (locale === "my" ? MONTHS.my : MONTHS.en)[Number(mo) - 1] ?? mo;
  return locale === "my"
    ? `${myanmarDigits(Number(y))} ${month} ${myanmarDigits(Number(d))}`
    : `${Number(d)} ${month} ${y}`;
}
