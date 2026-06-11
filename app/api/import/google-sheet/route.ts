import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    source: "google-sheet",
    message: "預留接口：未來可由 n8n 或 Google Sheets API 匯入手動整理後的內容數據。"
  });
}
