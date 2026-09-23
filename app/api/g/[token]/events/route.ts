import { NextResponse } from "next/server";
import { recordReceiverEvent } from "@/features/gifts/public";
import { receiverEventSchema } from "@/features/gifts/schemas";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

/**
 * POST /api/g/[token]/events
 * Authentication: none. Authorization: the share token itself.
 * Input: { type: "opened" | "viewed", sessionId }. Rate limited per client.
 * Returns only { ok }. Never returns gift data, so probing tokens here
 * reveals nothing beyond what the page already shows.
 */
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const allowed = await checkRateLimit(`recv:${clientKey(request)}`, 60, 60);
  if (!allowed) return NextResponse.json({ ok: false }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = receiverEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const ok = await recordReceiverEvent(token, parsed.data.type, parsed.data.sessionId);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
