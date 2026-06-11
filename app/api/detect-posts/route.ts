import { NextRequest, NextResponse } from "next/server";
import type { ContentRecord, DetectPostsResult, Platform } from "@/types/social";

interface DetectRequest {
  sourceType?: "YouTube RSS" | "Sports News RSS" | "Platform API";
  platform: Platform;
  account: string;
  accountUrl: string;
  defaultTopic?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as DetectRequest;

  if (body.sourceType === "Sports News RSS" || looksLikeRssUrl(body.accountUrl)) {
    const result = await detectSportsNewsRss(body);
    return NextResponse.json(result);
  }

  if (body.platform === "YouTube Shorts" || body.sourceType === "YouTube RSS") {
    const result = await detectYouTube(body);
    return NextResponse.json(result);
  }

  const result: DetectPostsResult = {
    ok: false,
    needsAuth: true,
    records: [],
    message:
      `${body.platform} 需要官方 API、n8n 或 Google Sheet 匯入才能穩定偵測貼文與成效。` +
      "目前已預留串接架構，請先用手動補數據或改用 YouTube 頻道 RSS 測試。"
  };
  return NextResponse.json(result);
}

async function detectSportsNewsRss(input: DetectRequest): Promise<DetectPostsResult> {
  if (!input.accountUrl) {
    return { ok: false, records: [], message: "請輸入 RSS URL。" };
  }
  const response = await fetch(input.accountUrl, { cache: "no-store" });
  if (!response.ok) {
    return { ok: false, records: [], message: `RSS 讀取失敗：${response.status}` };
  }
  const xml = await response.text();
  const records = parseGenericFeed(xml, input).slice(0, 12);
  return {
    ok: true,
    records,
    message: records.length
      ? `已從 RSS 偵測 ${records.length} 則國外體育新聞，並自動補上中文文案方向。`
      : "RSS 讀取成功，但沒有找到可用文章。"
  };
}

async function detectYouTube(input: DetectRequest): Promise<DetectPostsResult> {
  const channelId = extractYouTubeChannelId(input.accountUrl);
  if (!channelId) {
    return {
      ok: false,
      records: [],
      message: "請輸入包含 YouTube channel ID 的網址，例如 https://www.youtube.com/channel/UCxxxx。若是 @handle，未來可改用 YouTube API 解析。"
    };
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const response = await fetch(feedUrl, { cache: "no-store" });
  if (!response.ok) {
    return {
      ok: false,
      records: [],
      message: `YouTube RSS 讀取失敗：${response.status}`
    };
  }

  const xml = await response.text();
  const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)).slice(0, 12);
  const records = entries.map((entry) => entryToRecord(entry[1], input)).filter(Boolean) as ContentRecord[];

  return {
    ok: true,
    records,
    message: records.length
      ? `已從 YouTube RSS 偵測 ${records.length} 支影片。RSS 不含觀看/互動數，成效數字可先手動補上，未來再接 YouTube API。`
      : "沒有偵測到影片。"
  };
}

function entryToRecord(entry: string, input: DetectRequest): ContentRecord | null {
  const videoId = textBetween(entry, "<yt:videoId>", "</yt:videoId>");
  const title = decodeXml(textBetween(entry, "<title>", "</title>"));
  const published = textBetween(entry, "<published>", "</published>");
  const link = textBetween(entry, "href=\"", "\"");
  if (!videoId || !title) return null;

  return {
    id: `youtube-${videoId}`,
    platform: "YouTube Shorts",
    account: input.account || "YouTube 頻道",
    publishedAt: published ? published.slice(0, 16) : new Date().toISOString().slice(0, 16),
    contentType: "影片",
    topic: input.defaultTopic || "賽事討論",
    originalCopy: title,
    imageTitle: title.slice(0, 40),
    videoOpening: `${title.slice(0, 32)}，這支內容可以優化前三秒開頭。`,
    cta: "留言一起聊",
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    dms: 0,
    clicks: 0,
    notes: `自動偵測來源：${link || input.accountUrl}`,
    createdAt: new Date().toISOString()
  };
}

function parseGenericFeed(xml: string, input: DetectRequest): ContentRecord[] {
  const atomEntries = Array.from(xml.matchAll(/<entry[\s\S]*?>([\s\S]*?)<\/entry>/g)).map((match) => match[1]);
  if (atomEntries.length) return atomEntries.map((entry, index) => genericEntryToRecord(entry, input, index, "atom")).filter(Boolean) as ContentRecord[];
  const rssItems = Array.from(xml.matchAll(/<item[\s\S]*?>([\s\S]*?)<\/item>/g)).map((match) => match[1]);
  return rssItems.map((item, index) => genericEntryToRecord(item, input, index, "rss")).filter(Boolean) as ContentRecord[];
}

function genericEntryToRecord(entry: string, input: DetectRequest, index: number, type: "rss" | "atom"): ContentRecord | null {
  const title = decodeXml(stripCdata(textBetween(entry, "<title>", "</title>"))).trim();
  const summary = decodeXml(stripHtml(stripCdata(textBetween(entry, "<description>", "</description>") || textBetween(entry, "<summary>", "</summary>")))).trim();
  const pubDate = textBetween(entry, "<pubDate>", "</pubDate>") || textBetween(entry, "<published>", "</published>") || textBetween(entry, "<updated>", "</updated>");
  const link = type === "atom" ? textBetween(entry, "href=\"", "\"") : textBetween(entry, "<link>", "</link>");
  if (!title) return null;
  const chineseCopy = buildDetectedCopy(title, summary, input.defaultTopic || "國外體育新聞");
  return {
    id: `rss-${hash(`${title}-${pubDate}-${index}`)}`,
    platform: input.platform || "Threads",
    account: input.account || "國外體育 RSS",
    publishedAt: parseDate(pubDate),
    contentType: "文章",
    topic: input.defaultTopic || "國外體育新聞",
    originalCopy: chineseCopy,
    imageTitle: buildImageTitle(title, input.defaultTopic || "體育快訊"),
    videoOpening: `國外體育圈正在討論：${title.slice(0, 42)}`,
    cta: "留言一起聊",
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    dms: 0,
    clicks: 0,
    notes: `RSS 來源：${link || input.accountUrl}`,
    createdAt: new Date().toISOString()
  };
}

function buildDetectedCopy(title: string, summary: string, topic: string) {
  const context = summary ? `\n\n重點摘要：${summary.slice(0, 160)}` : "";
  return [
    `國外體育圈正在討論這題：${title}`,
    context,
    "",
    `這則可以延伸成「${topic}」內容：先丟出球迷會想表態的問題，再補上賽事分析與免費看球入口。`,
    "",
    "你覺得這個話題會影響今晚討論熱度嗎？留言一起聊。"
  ].join("\n").trim();
}

function buildImageTitle(title: string, topic: string) {
  const clean = title.replace(/\s+/g, " ").trim();
  return clean.length > 22 ? `${topic}：${clean.slice(0, 22)}...` : `${topic}：${clean}`;
}

function extractYouTubeChannelId(url: string) {
  const direct = url.match(/channel\/(UC[a-zA-Z0-9_-]+)/)?.[1];
  if (direct) return direct;
  const plain = url.match(/(UC[a-zA-Z0-9_-]{20,})/)?.[1];
  return plain ?? "";
}

function looksLikeRssUrl(url: string) {
  return /rss|feed|xml|atom|news\.google\.com\/rss/i.test(url);
}

function textBetween(value: string, start: string, end: string) {
  const startIndex = value.indexOf(start);
  if (startIndex === -1) return "";
  const contentStart = startIndex + start.length;
  const endIndex = value.indexOf(end, contentStart);
  if (endIndex === -1) return "";
  return value.slice(contentStart, endIndex);
}

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function stripCdata(value: string) {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

function parseDate(value: string) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 16) : date.toISOString().slice(0, 16);
}

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = Math.imul(31, h) + value.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(36);
}
