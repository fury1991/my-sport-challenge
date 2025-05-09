// src/lib/formatDate.ts

import moment from "moment";

export function formatGermanDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatGermanDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return moment(d).format("MM.DD");
}