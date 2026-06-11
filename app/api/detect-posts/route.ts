import { NextRequest, NextResponse } from "next/server";
import type { ContentRecord, DetectPostsResult, Platform } from "@/types/social";

interface DetectRequest {
  platform: Platform;
  account: string;
  accountUrl: string;
  defaultTopic?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as DetectRequest;

  if (body.platform === "YouTube Shorts") {
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

function extractYouTubeChannelId(url: string) {
  const direct = url.match(/channel\/(UC[a-zA-Z0-9_-]+)/)?.[1];
  if (direct) return direct;
  const plain = url.match(/(UC[a-zA-Z0-9_-]{20,})/)?.[1];
  return plain ?? "";
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
