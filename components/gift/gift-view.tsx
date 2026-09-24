import { useTranslations } from "next-intl";
import { GiftRenderer } from "./gift-renderer";

type Props = Omit<React.ComponentProps<typeof GiftRenderer>, "labels">;

/** GiftRenderer with translated labels. Use from server or client components. */
export function GiftView(props: Props) {
  const t = useTranslations("gift");
  return (
    <GiftRenderer
      {...props}
      labels={{
        forName: t("forName", { name: "{name}" }),
        forYou: t("forYou"),
        addPhoto: t("addPhoto"),
        questionNote: t("questionNote"),
      }}
    />
  );
}
