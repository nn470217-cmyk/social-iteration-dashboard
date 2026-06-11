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
  const fanAngle = `${topic}、熱門球星、迷因梗、台灣球迷討論`;
  const imagePrompts = make(5, (index) => {
    return [
      "professional sports live broadcast social media poster",
      "black and gold color palette",
      "Taiwan sports fan community",
      `topic: ${topic}`,
      `Taiwan fan angle: ${fanAngle}`,
      `visual headline concept ${index + 1}`,
      "stadium lights, scoreboard, clean editorial layout, no gambling, no betting"
    ].join(", ");
  });

  return {
    threadsCopies: make(10, (index) => `今晚${topic}討論度正在升溫。\n\n我整理了第 ${index + 1} 個看點：${keyword}。\n\n你覺得關鍵會在哪一段？${cta}`),
    igStories: make(10, (index) => `${topic}｜第 ${index + 1} 個看點\n球迷留言區準備開會\n${cta}`),
    imageTitles: make(10, (index) => `${topic}台灣球迷先看這 ${index + 1} 點`),
    imagePrompts,
    imageUrls: imagePrompts.map((prompt) => pollinationsImageUrl(prompt)),
    videoOpenings: make(10, (index) => `今晚${topic}不要只看比分，台灣球迷會吵的是第 ${index + 1} 個點。`),
    videoScripts: make(5, (index) => {
      return `0-3 秒：今晚${topic}先丟一句「留言區一定開會」。\n3-8 秒：帶出台灣球迷熟悉的球星、爭議或迷因梗。\n8-15 秒：補上分析師觀點：${keyword}。\n15-20 秒：${cta}，免費看球入口與賽前重點放主頁。`;
    }),
    ctas: make(10, (index) => {
      const variants = [
        "留言你站哪邊",
        "私訊關鍵字：看球",
        "主頁連結看免費直播入口",
        "加入官方帳號拿賽前重點",
        "留言隊伍名，我整理看點"
      ];
      return variants[index % variants.length];
    }),
    source: "local"
  };
}

function make(count: number, build: (index: number) => string) {
  return Array.from({ length: count }, (_, index) => sanitizeText(build(index)));
}

export function pollinationsImageUrl(prompt: string) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(sanitizeText(prompt))}?width=1080&height=1350&nologo=true&enhance=true&model=flux`;
}
