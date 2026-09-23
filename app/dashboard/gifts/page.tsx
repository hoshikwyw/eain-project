import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Lovebirds } from "@/components/brand/lovebirds";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function GiftsPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.gifts")}
        action={
          <Button asChild>
            <Link href="/create">
              <Plus />
              {t("createNewGift")}
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="w-full max-w-60">
            <Lovebirds />
          </div>
          <p className="text-sm text-muted-foreground">{t("recentGiftsEmpty")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
