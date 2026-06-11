import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    source: "tiktok",
    message: "預留接口：未來可串 TikTok API 匯入短影音成效數據。"
  });
}
