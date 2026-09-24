import { NextResponse } from "next/server";
import { submitResponse } from "@/features/gifts/public";
import { responseSubmissionSchema } from "@/features/gifts/schemas";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

/**
 * POST /api/g/[token]/responses
 * Authentication: none. Authorization: the share token itself.
 * Input: { sessionId, answers: [{ questionId, optionId?, text?, number? }] }.
 * The database function validates that every question and option belongs
 * to this gift and that required questions are answered. One response per
 * browser session. Returns only { ok } or an error code.
 */
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  const allowed = await checkRateLimit(`resp:${clientKey(request)}`, 20, 60);
  if (!allowed) return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }
  const parsed = responseSubmissionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const result = await submitResponse(token, parsed.data);
  if (result.ok) return NextResponse.json({ ok: true });

  const status = result.reason === "not-found" ? 404 : result.reason === "duplicate" ? 409 : result.reason === "invalid" ? 400 : 500;
  return NextResponse.json({ ok: false, error: result.reason }, { status });
}
