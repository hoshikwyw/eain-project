import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { calendarEntry, icsFile } from "@/features/gifts/calendar";
import { getPublicGift } from "@/features/gifts/public";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

/**
 * GET /api/g/[token]/calendar?section=<id>
 * Authentication: none. Authorization: the share token itself, as the page.
 * The event section as an .ics file, so a guest can add the date to Apple
 * Calendar, Outlook or any other. Only an event with a real date set by the
 * creator is served; otherwise 404. Carries nothing the page does not show.
 */
export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return new NextResponse(null, { status: 400 });

  const allowed = await checkRateLimit(`cal:${clientKey(request)}`, 30, 60);
  if (!allowed) return new NextResponse(null, { status: 429 });

  const gift = await getPublicGift(token);
  if (!gift) return new NextResponse(null, { status: 404 });

  const wanted = new URL(request.url).searchParams.get("section");
  const section = gift.sections.find(
    (s) => s.type === "event" && (!wanted || s.id === wanted) && Boolean(s.content.startsAt),
  );
  if (!section || section.type !== "event") return new NextResponse(null, { status: 404 });

  const t = await getTranslations("gift");
  const entry = calendarEntry(section, gift.sections, t("invitation.title"));
  if (!entry) return new NextResponse(null, { status: 404 });

  return new NextResponse(icsFile(entry, section.id), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="invitation.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
