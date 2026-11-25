import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AdminFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmButton } from "@/components/gift/confirm-button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { reviewPayment } from "@/features/admin/actions";
import { listPayments, requireAdmin } from "@/features/admin/queries";

const WALLET: Record<string, string> = { kbzpay: "KBZPay", wavepay: "WavePay" };

/**
 * The sales queue. A customer who paid presses "I've paid" on the buy page;
 * the payment waits here until an admin finds it in the wallet app and
 * approves it (the template unlocks) or rejects it with a reason. Either way
 * the customer is notified and the decision is logged.
 */
export default async function AdminPaymentsPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const { pending, decided } = await listPayments();
  const when = (iso: string | null) =>
    iso ? format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.payments")}
        subtitle={t("payments.subtitle", { count: pending.length })}
      />
      <AdminFlash />

      <section aria-labelledby="pending-title" className="flex flex-col gap-3">
        <h2 id="pending-title" className="font-semibold">
          {t("payments.pendingTitle", { count: pending.length })}
        </h2>
        {pending.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {t("payments.nonePending")}
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((p) => {
              const wallet = WALLET[p.provider] ?? p.provider;
              const amount = `${format.number(p.amount_mmk)} Ks`;
              return (
                <li key={p.id}>
                  <Card>
                    <CardContent className="flex flex-col gap-4 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{p.templateName || "—"}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.user_id ? (
                              <Link
                                href={`/admin/users/${p.user_id}`}
                                className="underline-offset-4 hover:underline"
                              >
                                {p.customerName || p.customerEmail}
                              </Link>
                            ) : (
                              "—"
                            )}
                            {p.customerEmail && p.customerName ? ` · ${p.customerEmail}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">{when(p.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-xl font-semibold">{amount}</p>
                          <p className="text-sm">
                            {wallet} ·{" "}
                            <span className="font-mono tracking-wide select-all">
                              {p.provider_reference}
                            </span>
                          </p>
                        </div>
                      </div>
                      {/* Two forms: the confirm popup submits its own form, so each decision has one. */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                        <form action={reviewPayment}>
                          <input type="hidden" name="paymentId" value={p.id} />
                          <input type="hidden" name="approve" value="1" />
                          <ConfirmButton
                            confirmText={t("payments.approveConfirm", {
                              amount,
                              wallet,
                              reference: p.provider_reference,
                            })}
                          >
                            {t("payments.approve")}
                          </ConfirmButton>
                        </form>
                        <form action={reviewPayment} className="flex flex-1 gap-2">
                          <input type="hidden" name="paymentId" value={p.id} />
                          <input type="hidden" name="approve" value="0" />
                          <Input
                            name="note"
                            maxLength={200}
                            placeholder={t("payments.notePlaceholder")}
                            aria-label={t("payments.note")}
                            className="flex-1"
                          />
                          <ConfirmButton
                            variant="secondary"
                            confirmText={t("payments.rejectConfirm")}
                          >
                            {t("payments.reject")}
                          </ConfirmButton>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="decided-title" className="flex flex-col gap-3">
        <h2 id="decided-title" className="font-semibold">
          {t("payments.decidedTitle")}
        </h2>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {decided.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {p.templateName || "—"} · {p.customerName || p.customerEmail || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {WALLET[p.provider] ?? p.provider} · {p.provider_reference} ·{" "}
                      {when(p.verified_at)}
                      {p.review_note ? ` · ${p.review_note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{format.number(p.amount_mmk)} Ks</span>
                    <Chip tone={p.status === "verified" ? "success" : "neutral"}>
                      {t(`payments.status.${p.status}`)}
                    </Chip>
                  </div>
                </li>
              ))}
              {decided.length === 0 && (
                <li className="p-8 text-center text-sm text-muted-foreground">
                  {t("payments.empty")}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
