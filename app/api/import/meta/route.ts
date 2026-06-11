import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    source: "meta",
    message: "預留接口：未來可串 Meta API 匯入 IG / Threads 成效數據。"
  });
}
