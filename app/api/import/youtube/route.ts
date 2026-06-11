import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    source: "youtube",
    message: "預留接口：未來可串 YouTube API 匯入 Shorts 成效數據。"
  });
}
