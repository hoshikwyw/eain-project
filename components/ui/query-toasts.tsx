"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "@/lib/toast";

export type QueryToast = {
  /** The search parameter that carries the news, such as `published`. */
  param: string;
  /** The value it must have. Defaults to `1`. */
  value?: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
};

/**
 * Turns the outcome a server action put in the URL (`?published=1`) into a
 * toast, once, then takes the parameter off the address so a refresh or a
 * shared link does not repeat it. Server actions cannot show toasts
 * themselves; after a redirect this is how their news arrives.
 */
export function QueryToasts({ items }: { items: QueryToast[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const hits = items.filter((i) => params.get(i.param) === (i.value ?? "1"));
    if (hits.length === 0) return;
    fired.current = true;
    for (const hit of hits) {
      toast[hit.type](hit.title, { description: hit.description });
    }
    const rest = new URLSearchParams(params);
    for (const hit of hits) rest.delete(hit.param);
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [items, params, pathname, router]);

  return null;
}
