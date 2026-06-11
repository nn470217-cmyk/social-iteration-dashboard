import type { AccountSource, ContentRecord } from "@/types/social";

const recordsKey = "semi-auto-social-iteration-records";
const sourcesKey = "semi-auto-social-iteration-sources";

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

export function loadSources(): AccountSource[] {
  if (!canUseStorage()) return [];
  return JSON.parse(window.localStorage.getItem(sourcesKey) ?? "[]") as AccountSource[];
}

export function saveSources(sources: AccountSource[]) {
  if (canUseStorage()) window.localStorage.setItem(sourcesKey, JSON.stringify(sources));
}
