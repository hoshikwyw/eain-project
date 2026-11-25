import { redirect } from "next/navigation";

/**
 * Points were retired when premium templates moved to kyat (migration 0028).
 * Old links and bookmarks to the points page land on Home instead.
 */
export default function PointsPage(): never {
  redirect("/dashboard");
}
