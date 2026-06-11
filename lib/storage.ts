import type { ContentRecord } from "@/types/social";

const recordsKey = "semi-auto-social-iteration-records";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function loadRecords(): ContentRecord[] {
  if (!canUseStorage()) return [];
  return JSON.parse(window.localStorage.getItem(recordsKey) ?? "[]") as ContentRecord[];
}

export function saveRecords(records: ContentRecord[]) {
  if (canUseStorage()) window.localStorage.setItem(recordsKey, JSON.stringify(records));
}

export function clearRecords() {
  if (canUseStorage()) window.localStorage.removeItem(recordsKey);
}
