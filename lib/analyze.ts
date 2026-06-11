import { generateNextPack } from "@/lib/generate";
import { scoreRecords } from "@/lib/scoring";
import type { AnalysisResult, ContentRecord, RankingRow, ScoredRecord } from "@/types/social";

const stopWords = new Set([
  "體育",
  "直播",
  "賽事",
  "討論",
  "免費",
  "看球",
  "球迷",
  "今日",
  "今晚",
  "入口",
  "主頁",
  "連結"
]);

export function analyzeRecords(records: ContentRecord[]): AnalysisResult {
  const scored = scoreRecords(records);
  const highRecords = scored.filter((record) => record.label === "爆款" || record.label === "潛力").slice(0, 10);
  const lowRecords = scored.filter((record) => record.label === "低效").slice(-10).reverse();

  const platformRanking = rankBy(scored, (record) => record.platform);
  const accountRanking = rankBy(scored, (record) => record.account || "未填帳號");
  const topicRanking = rankBy(scored, (record) => record.topic || "未填主題");
  const typeRanking = rankBy(scored, (record) => record.contentType);
  const ctaRanking = rankBy(scored, (record) => record.cta || "未填 CTA");
  const keywordRanking = rankKeywords(scored);
  const bestPostHour = rankBy(scored, (record) => {
    const date = new Date(record.publishedAt);
    if (Number.isNaN(date.getTime())) return "未填時間";
    return `${date.getHours().toString().padStart(2, "0")}:00`;
  })[0] ?? null;

  const highFeatures = buildHighFeatures(highRecords, topicRanking, typeRanking, ctaRanking, keywordRanking);
  const lowProblems = buildLowProblems(lowRecords);
  const nextDirections = buildNextDirections(platformRanking, topicRanking, ctaRanking, highFeatures);
  const generated = generateNextPack({ highRecords, topicRanking, ctaRanking, keywordRanking });

  return {
    totalRecords: records.length,
    totalViews: sum(scored, (record) => record.views),
    totalEngagements: sum(scored, (record) => record.likes + record.comments + record.shares + record.saves),
    totalDms: sum(scored, (record) => record.dms),
    totalClicks: sum(scored, (record) => record.clicks),
    averageScore: scored.length ? Math.round(sum(scored, (record) => record.score) / scored.length) : 0,
    scored,
    highRecords,
    lowRecords,
    platformRanking,
    accountRanking,
    topicRanking,
    typeRanking,
    ctaRanking,
    keywordRanking,
    bestPostHour,
    highFeatures,
    lowProblems,
    nextDirections,
    generated
  };
}

function rankBy(items: ScoredRecord[], pick: (record: ScoredRecord) => string): RankingRow[] {
  const map = new Map<string, { score: number; count: number }>();
  items.forEach((item) => {
    const key = pick(item).trim() || "未分類";
    const current = map.get(key) ?? { score: 0, count: 0 };
    map.set(key, { score: current.score + item.score, count: current.count + 1 });
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({
      name,
      score: value.score,
      count: value.count,
      avgScore: Math.round(value.score / value.count)
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
}

function rankKeywords(items: ScoredRecord[]): RankingRow[] {
  const map = new Map<string, { score: number; count: number }>();
  items.forEach((item) => {
    const text = `${item.topic} ${item.originalCopy} ${item.imageTitle} ${item.videoOpening} ${item.cta}`;
    const words = Array.from(text.matchAll(/[\u4e00-\u9fa5A-Za-z0-9]{2,12}/g)).map((match) => match[0]);
    Array.from(new Set(words)).forEach((word) => {
      if (stopWords.has(word)) return;
      const current = map.get(word) ?? { score: 0, count: 0 };
      map.set(word, { score: current.score + item.score, count: current.count + 1 });
    });
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({
      name,
      score: value.score,
      count: value.count,
      avgScore: Math.round(value.score / value.count)
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 12);
}

function buildHighFeatures(
  highRecords: ScoredRecord[],
  topics: RankingRow[],
  types: RankingRow[],
  ctas: RankingRow[],
  keywords: RankingRow[]
): string[] {
  if (!highRecords.length) return ["高分內容樣本不足，先累積至少 5 筆資料再判斷共同特徵。"];
  return [
    `高分內容常見主題是「${topics[0]?.name ?? "未分類"}」，平均分數最高。`,
    `內容形式以「${types[0]?.name ?? "未分類"}」表現較好，可以優先複製這個格式。`,
    `CTA 以「${ctas[0]?.name ?? "未填 CTA"}」較容易帶出互動或私訊。`,
    `高互動關鍵字包含「${keywords.slice(0, 4).map((item) => item.name).join("、") || "資料不足"}」。`,
    "高分內容通常有明確看點、清楚 CTA，並且能讓球迷留言表態。"
  ];
}

function buildLowProblems(lowRecords: ScoredRecord[]): string[] {
  if (!lowRecords.length) return ["目前低效內容不足，暫時不需要刪減方向。"];
  return [
    "低分內容可能缺少明確 CTA，使用者看完不知道要留言、私訊或點連結。",
    "低分內容的圖片標題或影片開頭可能不夠有衝突點，前 3 秒吸引力不足。",
    "只提供資訊但沒有球迷交流問題，容易讓留言數與分享數偏低。",
    ...lowRecords.slice(0, 3).map((record) => `需要檢討「${record.topic || "未填主題"} / ${record.cta || "未填 CTA"}」這組內容方向。`)
  ];
}

function buildNextDirections(platforms: RankingRow[], topics: RankingRow[], ctas: RankingRow[], highFeatures: string[]): string[] {
  return [
    `下一輪優先投放到「${platforms[0]?.name ?? "Threads"}」，因為目前平均成效較好。`,
    `主題先加碼「${topics[0]?.name ?? "球迷討論"}」，搭配賽前看點與免費看球入口。`,
    `CTA 建議沿用「${ctas[0]?.name ?? "留言一起聊"}」，並做 2-3 種語氣測試。`,
    "影片前三秒要先丟出爭議點或球迷會想回答的問題。",
    highFeatures[0] ?? "先累積更多高分內容，再建立固定爆款模板。"
  ];
}

function sum(items: ScoredRecord[], pick: (record: ScoredRecord) => number) {
  return items.reduce((total, item) => total + pick(item), 0);
}
