import type { ContentLabel, ContentRecord, ScoredRecord } from "@/types/social";

export function scoreRecord(record: ContentRecord): number {
  return Math.round(
    record.views * 0.2 +
      record.likes * 1 +
      record.comments * 2 +
      record.shares * 3 +
      record.saves * 3 +
      record.dms * 5 +
      record.clicks * 4
  );
}

export function labelScore(score: number): ContentLabel {
  if (score >= 1500) return "爆款";
  if (score >= 650) return "潛力";
  if (score >= 220) return "普通";
  return "低效";
}

export function scoreRecords(records: ContentRecord[]): ScoredRecord[] {
  return records
    .map((record) => {
      const score = scoreRecord(record);
      return { ...record, score, label: labelScore(score) };
    })
    .sort((a, b) => b.score - a.score);
}
