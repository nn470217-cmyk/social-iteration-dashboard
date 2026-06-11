import { sanitizeText } from "@/lib/safety";
import type { GeneratedPack, RankingRow, ScoredRecord } from "@/types/social";

interface GenerateInput {
  highRecords: ScoredRecord[];
  topicRanking: RankingRow[];
  ctaRanking: RankingRow[];
  keywordRanking: RankingRow[];
}

export function generateNextPack(input: GenerateInput): GeneratedPack {
  const best = input.highRecords[0];
  const topic = input.topicRanking[0]?.name || best?.topic || "球迷討論";
  const cta = input.ctaRanking[0]?.name || best?.cta || "留言一起聊";
  const keyword = input.keywordRanking[0]?.name || "免費看球";

  return {
    threadsCopies: make(10, (index) => `今晚${topic}討論度正在升溫。\n\n我整理了第 ${index + 1} 個看點：${keyword}。\n\n你覺得關鍵會在哪一段？${cta}`),
    igStories: make(10, (index) => `${topic}｜第 ${index + 1} 個看點\n${keyword}已整理\n${cta}`),
    imageTitles: make(10, (index) => `${topic}先看這 ${index + 1} 點`),
    videoOpenings: make(10, (index) => `今晚${topic}不要只看比分，前 3 秒先看第 ${index + 1} 個關鍵。`),
    ctas: make(10, (index) => {
      const variants = [
        "留言你站哪邊",
        "私訊關鍵字：看球",
        "主頁連結看免費直播入口",
        "加入官方帳號拿賽前重點",
        "留言隊伍名，我整理看點"
      ];
      return variants[index % variants.length];
    })
  };
}

function make(count: number, build: (index: number) => string) {
  return Array.from({ length: count }, (_, index) => sanitizeText(build(index)));
}
