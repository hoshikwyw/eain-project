"use client";

import { Download } from "lucide-react";
import { useFormatter } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ResponseView } from "@/features/gifts/queries";
import { toast } from "@/lib/toast";

type Props = {
  responses: ResponseView[];
  /** The gift's title, for the file name. */
  title: string;
  labels: { button: string; dateColumn: string; downloaded: string };
};

/** A spreadsheet cell: quoted when it holds a comma, a quote or a line break. */
const cell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/**
 * Saves the replies as a CSV file: one row per reply, one column per
 * question, the time first. Built in the browser from what the page already
 * has, so nothing is sent anywhere. Starts with a byte-order mark so Excel
 * reads Burmese correctly.
 */
export function DownloadReplies({ responses, title, labels }: Props) {
  const format = useFormatter();

  function download() {
    const prompts: string[] = [];
    for (const r of responses)
      for (const a of r.answers) if (!prompts.includes(a.prompt)) prompts.push(a.prompt);
    const header = [labels.dateColumn, ...prompts].map(cell).join(",");
    const rows = responses.map((r) =>
      [
        format.dateTime(new Date(r.createdAt), { dateStyle: "medium", timeStyle: "short" }),
        ...prompts.map((p) => r.answers.find((a) => a.prompt === p)?.value ?? ""),
      ]
        .map(cell)
        .join(","),
    );
    const csv = "﻿" + [header, ...rows].join("\r\n") + "\r\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "gift"} - replies.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(labels.downloaded, { duration: 2500 });
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={download}>
      <Download />
      {labels.button}
    </Button>
  );
}
