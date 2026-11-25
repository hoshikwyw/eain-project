"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** What the buy page can say went wrong, as ?error= on its address. */
export type PurchaseError = "reference" | "owned" | "pending" | "unknown";

/**
 * "I've paid": the customer names the wallet and the last digits of the
 * transaction. The database function makes one pending payment per template
 * (asking twice returns the same one) for an admin to check and approve.
 */
export async function requestPurchase(formData: FormData): Promise<void> {
  const slug = String(formData.get("template") ?? "");
  const back = (query: string): never =>
    redirect(`/dashboard/buy/${encodeURIComponent(slug)}?${query}`);

  const parsed = z
    .object({
      templateId: z.uuid(),
      provider: z.enum(["kbzpay", "wavepay"]),
      reference: z.string().trim().min(4).max(60),
    })
    .safeParse({
      templateId: formData.get("templateId"),
      provider: formData.get("provider"),
      reference: formData.get("reference"),
    });
  if (!parsed.success) back("error=reference");
  const { templateId, provider, reference } = parsed.data!;

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_template_purchase", {
    p_template_id: templateId,
    p_provider: provider,
    p_reference: reference,
  });
  revalidatePath(`/dashboard/buy/${slug}`);
  if (error) {
    const m = error.message;
    back(
      `error=${
        m.includes("bad reference")
          ? "reference"
          : m.includes("already owned")
            ? "owned"
            : m.includes("too many pending")
              ? "pending"
              : "unknown"
      }`,
    );
  }
  back("sent=1");
}
