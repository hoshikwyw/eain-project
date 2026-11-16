"use client";

import { Toaster, toast } from "@yusufceng1z/ding-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * The one place toasts appear, mounted once in the root layout. Follows the
 * site theme and names its live region and close button in the reader's
 * language. Colours, type and corners come from app/globals.css.
 */
export function AppToaster() {
  const t = useTranslations("toast");
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "system";

  useEffect(() => {
    // A toast that waits to be dismissed (an error, one with a button) keeps
    // its place while newer, short-lived toasts come and go beside it.
    toast.configure({ held: "list" });
  }, []);

  return (
    <Toaster
      position="top-center"
      theme={theme}
      labels={{ region: t("region"), dismiss: t("dismiss") }}
    />
  );
}
