import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { AdminFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConfirmButton } from "@/components/gift/confirm-button";
import { GiftStatusChip } from "@/components/gift/gift-status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { adjustPoints, setUserRole } from "@/features/admin/actions";
import { requireAdmin } from "@/features/admin/queries";
import { deleteUserAccount, suspendUser, takeUserGiftsOffline, unsuspendUser } from "@/features/admin/user-actions";
import { getUserAdmin } from "@/features/admin/users";

const selectClass = "h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export default async function AdminUserDetailPage({ params, searchParams }: PageProps<"/admin/users/[userId]">) {
  const me = await requireAdmin();
  const { userId } = await params;
  const query = await searchParams;
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const u = await getUserAdmin(userId);
  if (!u) notFound();

  const isSelf = u.id === me.id;
  const date = (iso: string | null) => (iso ? format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" }) : "—");
  const published = u.gifts.filter((g) => g.status === "published").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={u.profile?.display_name || u.email}
        subtitle={u.email}
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/users">
              <ArrowLeft />
              {t("users.back")}
            </Link>
          </Button>
        }
      />
      <AdminFlash ok={typeof query.ok === "string" ? query.ok : undefined} error={typeof query.error === "string" ? query.error : undefined} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("users.detail.account")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Row label={t("users.detail.status")}>
                  {u.suspended ? <Chip tone="brand">{t("users.suspended")}</Chip> : <Chip tone="success">{t("users.active")}</Chip>}
                </Row>
                <Row label={t("users.role")}>
                  <Chip tone={u.profile?.role === "admin" ? "primary" : "neutral"}>{t(`users.roles.${u.profile?.role === "admin" ? "admin" : "user"}`)}</Chip>
                </Row>
                <Row label={t("users.detail.signIn")}>{t(`users.providers.${u.provider === "google" ? "google" : "email"}`)}</Row>
                <Row label={t("users.detail.emailConfirmed")}>{u.emailConfirmed ? t("users.detail.yes") : t("users.detail.no")}</Row>
                <Row label={t("users.detail.joined")}>{date(u.createdAt)}</Row>
                <Row label={t("users.detail.lastSignIn")}>{date(u.lastSignInAt)}</Row>
                <Row label={t("users.detail.language")}>{u.profile?.locale === "my" ? "မြန်မာ" : "English"}</Row>
                <Row label={t("users.detail.points")}>{u.profile?.points_balance ?? 0}</Row>
                <Row label={t("users.detail.gifts")}>{t("users.detail.giftsSummary", { total: u.gifts.length, published })}</Row>
                <Row label={t("users.detail.storage")}>{format.number(u.storageBytes / 1024 / 1024, { maximumFractionDigits: 2 })} MB</Row>
                <Row label="ID">
                  <code className="text-xs">{u.id}</code>
                </Row>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("users.detail.giftsTitle", { count: u.gifts.length })}</CardTitle>
              <CardDescription>{t("users.detail.giftsHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              {u.gifts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("users.detail.noGifts")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {u.gifts.map((g) => (
                    <li key={g.id}>
                      <Link href={`/admin/gifts/${g.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{g.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {g.templateName} · {date(g.created_at)}
                          </p>
                        </div>
                        {g.status === "deleted" ? <Chip tone="neutral">{t("reports.giftStatus.deleted")}</Chip> : <GiftStatusChip status={g.status} opened={g.opened} />}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("users.detail.pointsTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {u.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("points.empty")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {u.transactions.map((tx) => (
                    <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{date(tx.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip tone={tx.amount > 0 ? "success" : "brand"}>{tx.amount > 0 ? `+${tx.amount}` : tx.amount}</Chip>
                        <span className="w-12 text-right text-xs text-muted-foreground">= {tx.balance_after}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {(u.reports.length > 0 || u.audit.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>{t("users.detail.history")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {u.reports.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-2">
                    <Chip tone="brand">{t(`reports.reasons.${r.reason}`)}</Chip>
                    <Chip tone="neutral">{t(`reports.status.${r.status}`)}</Chip>
                    <span className="text-xs text-muted-foreground">{date(r.created_at)}</span>
                  </div>
                ))}
                {u.audit.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-2">
                    <Chip tone="primary">{a.action}</Chip>
                    <span className="text-xs text-muted-foreground">{date(a.created_at)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {isSelf && <p className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">{t("users.detail.selfNote")}</p>}

          <Card>
            <CardHeader>
              <CardTitle>{t("users.adjust")}</CardTitle>
              <CardDescription>{t("users.detail.adjustHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={adjustPoints} className="flex flex-col gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <input type="hidden" name="returnTo" value={`/admin/users/${u.id}`} />
                <div className="flex gap-2">
                  <Input name="amount" type="number" required placeholder="±50" className="w-28" />
                  <Input name="description" placeholder={t("users.reason")} maxLength={200} />
                </div>
                <SubmitButton variant="secondary" className="self-start">
                  {t("users.adjust")}
                </SubmitButton>
              </form>
            </CardContent>
          </Card>

          {!isSelf && (
            <Card>
              <CardHeader>
                <CardTitle>{t("users.role")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={setUserRole} className="flex gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="returnTo" value={`/admin/users/${u.id}`} />
                  <select name="role" defaultValue={u.profile?.role ?? "user"} className={selectClass} aria-label={t("users.role")}>
                    <option value="user">{t("users.roles.user")}</option>
                    <option value="admin">{t("users.roles.admin")}</option>
                  </select>
                  <SubmitButton variant="secondary">{t("users.setRole")}</SubmitButton>
                </form>
              </CardContent>
            </Card>
          )}

          {!isSelf && (
            <Card>
              <CardHeader>
                <CardTitle>{t("users.detail.moderation")}</CardTitle>
                <CardDescription>{u.suspended ? t("users.detail.suspendedHint") : t("users.detail.suspendHint")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {u.suspended ? (
                  <form action={unsuspendUser}>
                    <input type="hidden" name="userId" value={u.id} />
                    <SubmitButton variant="secondary" className="w-full">
                      {t("users.detail.unsuspend")}
                    </SubmitButton>
                  </form>
                ) : (
                  <form action={suspendUser} className="flex flex-col gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <Input name="reason" placeholder={t("users.detail.reasonPlaceholder")} maxLength={300} />
                    <ConfirmButton variant="secondary" className="w-full" confirmText={t("users.detail.suspendConfirm")}>
                      {t("users.detail.suspend")}
                    </ConfirmButton>
                  </form>
                )}

                {published > 0 && (
                  <form action={takeUserGiftsOffline} className="flex flex-col gap-2 border-t border-border pt-4">
                    <input type="hidden" name="userId" value={u.id} />
                    <Input name="reason" placeholder={t("users.detail.offlineReason")} maxLength={300} />
                    <ConfirmButton variant="secondary" className="w-full" confirmText={t("users.detail.offlineConfirm", { count: published })}>
                      {t("users.detail.offline", { count: published })}
                    </ConfirmButton>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {!isSelf && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">{t("users.detail.deleteTitle")}</CardTitle>
                <CardDescription>{t("users.detail.deleteHint")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={deleteUserAccount} className="flex flex-col gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <label className="text-xs text-muted-foreground" htmlFor="confirmEmail">
                    {t("users.detail.typeEmail", { email: u.email })}
                  </label>
                  <Input id="confirmEmail" name="confirmEmail" type="email" autoComplete="off" required placeholder={u.email} />
                  <ConfirmButton variant="ghost" className="w-full text-destructive" confirmText={t("users.detail.deleteConfirm")}>
                    {t("users.detail.delete")}
                  </ConfirmButton>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
