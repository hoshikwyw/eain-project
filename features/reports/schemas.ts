import { z } from "zod";

export const REPORT_REASONS = ["harassment", "spam", "scam", "inappropriate", "copyright", "malicious_link", "other"] as const;

export const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).default(""),
});

export type ReportState = { status?: "sent" | "invalid" | "rate-limited" | "not-found" | "error" };
