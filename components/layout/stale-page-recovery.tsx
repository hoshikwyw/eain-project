"use client";

import { useEffect } from "react";
import { reloadIfStale } from "@/lib/stale-page";

/**
 * Mounted once in the root layout. Catches the "Server Action … was not
 * found" error a page from an older deploy throws (as an uncaught error or an
 * unhandled rejection) and reloads the page once. Errors that reach an error
 * boundary instead are handled the same way in app/error.tsx.
 */
export function StalePageRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (reloadIfStale(event.error)) event.preventDefault();
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (reloadIfStale(event.reason)) event.preventDefault();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
