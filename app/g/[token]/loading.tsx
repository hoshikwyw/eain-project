import { getTranslations } from "next-intl/server";

/** Receiver loading screen: quiet, centred, no layout jump into the reveal. */
export default async function GiftLoading() {
  const t = await getTranslations("common");
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center" aria-busy="true">
      <span className="text-3xl text-brand" aria-hidden="true">
        ♥
      </span>
      <p className="text-sm text-muted-foreground">{t("loading")}…</p>
    </div>
  );
}
