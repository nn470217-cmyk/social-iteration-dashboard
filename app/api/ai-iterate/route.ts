import { NextRequest, NextResponse } from "next/server";
import { pollinationsImageUrl } from "@/lib/generate";
import { sanitizeText } from "@/lib/safety";
import type { GeneratedPack } from "@/types/social";

export const runtime = "edge";

interface AiRequest {
  summary?: {
    bestTopic?: string;
    bestCta?: string;
    keywords?: string[];
    highFeatures?: string[];
    lowProblems?: string[];
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AiRequest;
  const summary = body.summary ?? {};
  const topic = summary.bestTopic || "球迷討論";
  const cta = summary.bestCta || "留言一起聊";
  const keywords = summary.keywords?.join("、") || "免費看球、賽事討論、分析師觀點";

  const prompt = [
    "你是台灣體育直播社群內容企劃。",
    "請產出安全、專業、有互動感的社群素材。",
    "主軸只能是：體育直播、賽事討論、球迷交流、免費看球、賽事分析、分析師觀點。",
    "禁止出現：娛樂城、下注、賭博、博弈、儲值、返水、彩金、獎金、輸贏、投注、盤口、賠率。",
    `本輪最佳主題：${topic}`,
    `建議 CTA：${cta}`,
    `高互動關鍵字：${keywords}`,
    `高分特徵：${summary.highFeatures?.join("；") || "有明確看點、能引導留言、CTA 清楚"}`,
    `低分問題：${summary.lowProblems?.join("；") || "開頭不夠強、缺少互動問題"}`,
    "請只回傳 JSON，不要 markdown。",
    "JSON 格式：",
    "{\"threadsCopies\":[10組],\"igStories\":[10組],\"imageTitles\":[10組],\"imagePrompts\":[5組英文圖片生成提示詞],\"videoOpenings\":[10組],\"videoScripts\":[5組],\"ctas\":[10組]}"
  ].join("\n");

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Pollinations failed: ${response.status}`);
    const raw = await response.text();
    const data = JSON.parse(extractJson(raw)) as Omit<GeneratedPack, "source" | "imageUrls">;
    const pack = normalizePack(data);
    return NextResponse.json({ ok: true, generated: pack });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "AI API 暫時無法回應，請使用本地產出結果。",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 200 });
  }
}

function extractJson(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI response is not JSON");
  return raw.slice(start, end + 1);
}

function normalizePack(data: Omit<GeneratedPack, "source" | "imageUrls">): GeneratedPack {
  const imagePrompts = fill(data.imagePrompts, 5, "professional black gold sports live broadcast poster, stadium lights, clean social media design, no gambling, no betting");
  return {
    threadsCopies: fill(data.threadsCopies, 10, "今晚賽事討論度升溫，留言一起聊你的看法。"),
    igStories: fill(data.igStories, 10, "今晚焦點｜免費看球入口已整理｜主頁連結見"),
    imageTitles: fill(data.imageTitles, 10, "今晚焦點先看這 3 點"),
    imagePrompts,
    imageUrls: imagePrompts.map((prompt) => pollinationsImageUrl(prompt)),
    videoOpenings: fill(data.videoOpenings, 10, "今晚這場不要只看比分，先看這個關鍵回合。"),
    videoScripts: fill(data.videoScripts, 5, "0-3 秒：丟出今晚最大看點。\n3-15 秒：補上賽事分析。\n15-20 秒：引導留言與主頁入口。"),
    ctas: fill(data.ctas, 10, "留言你站哪邊"),
    source: "ai"
  };
}

function fill(items: string[] | undefined, count: number, fallback: string) {
  const safe = (items ?? []).map((item) => sanitizeText(String(item))).filter(Boolean);
  while (safe.length < count) safe.push(fallback);
  return safe.slice(0, count);
}
